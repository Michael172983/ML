import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import { type ContractAnalysis, type ThreatLevel, type ThreatCategory } from '../types/index.js';

const SYSTEM_PROMPT = `You are an expert Web3 smart contract security auditor. Your role is to analyze Ethereum smart contract bytecode, ABI data, and on-chain behavior to detect malicious patterns.

You specialize in detecting:
1. **Approval Scams** - Contracts that request unlimited token approvals to drain user funds
2. **Rug Pulls** - Liquidity removal functions hidden behind innocent-looking code
3. **Honeypots** - Tokens that can be bought but not sold
4. **Flash Loan Attacks** - Suspicious patterns exploiting flash loan mechanics
5. **Phishing Contracts** - Contracts mimicking legitimate protocols
6. **Liquidity Drain** - Sudden large liquidity removals from pools

Always respond with valid JSON in this exact schema:
{
  "threatLevel": "safe" | "low" | "medium" | "high" | "critical",
  "categories": string[],
  "confidence": number (0-100),
  "reasoning": string,
  "indicators": string[],
  "recommendation": string
}`;

type AIProvider = 'anthropic' | 'openai' | 'mock';

function detectProvider(): AIProvider {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'mock';
}

async function analyzeWithAnthropic(prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic');
  return block.text;
}

async function analyzeWithOpenAI(prompt: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  });
  return completion.choices[0].message.content ?? '{}';
}

/**
 * Deterministic mock analysis used when no API key is configured.
 * Simulates realistic threat distributions for demo purposes.
 */
function mockAnalysis(contractAddress: string, calldata: string): string {
  const seed = parseInt(contractAddress.slice(2, 10), 16);
  const scenarios: ContractAnalysis[] = [
    {
      contractAddress,
      threatLevel: 'critical',
      categories: ['approval_scam', 'rug_pull'],
      confidence: 97,
      reasoning:
        'Contract contains an unrestricted setApprovalForAll() that transfers ownership to a hardcoded attacker address. The withdrawAll() function bypasses standard access controls.',
      indicators: [
        'Unlimited approval request detected',
        'Hidden owner withdrawal function',
        'Contract deployed < 24h ago',
        'No verified source code on Etherscan',
        'Proxy pattern masking malicious logic',
      ],
      recommendation:
        '🚨 DO NOT interact with this contract. Initiate immediate fund evacuation to safety wallet.',
      analysisTimestamp: Date.now(),
    },
    {
      contractAddress,
      threatLevel: 'high',
      categories: ['liquidity_drain'],
      confidence: 88,
      reasoning:
        'Detected a sudden 94% liquidity removal in the past 3 blocks. The LP tokens were concentrated in a single EOA that is now attempting to exit.',
      indicators: [
        '94% TVL reduction in 3 blocks',
        'Single LP holder controls 98% of pool',
        'removeLiquidity() called with MAX_UINT256',
        'Token contract has no sell tax mechanism',
      ],
      recommendation:
        'High probability rug pull in progress. Evacuate assets immediately.',
      analysisTimestamp: Date.now(),
    },
    {
      contractAddress,
      threatLevel: 'medium',
      categories: ['honeypot'],
      confidence: 72,
      reasoning:
        'The sell function includes a blacklist check that references an off-chain oracle, allowing the deployer to selectively prevent token sales.',
      indicators: [
        'Blacklist modifier on transfer()',
        'Owner can pause trading',
        'Asymmetric buy/sell tax (0% / 99%)',
      ],
      recommendation:
        'Possible honeypot. Avoid purchasing this token. Monitor for further suspicious activity.',
      analysisTimestamp: Date.now(),
    },
    {
      contractAddress,
      threatLevel: 'safe',
      categories: [],
      confidence: 95,
      reasoning:
        'Contract matches known-good ABI signatures (Uniswap V3 Router). Source code verified on Etherscan. No malicious patterns detected.',
      indicators: ['Verified source code', 'Matches Uniswap V3 ABI', 'No hidden admin functions'],
      recommendation: 'Contract appears safe. Proceed with normal caution.',
      analysisTimestamp: Date.now(),
    },
  ];

  const idx = seed % scenarios.length;
  // For demo: if calldata starts with known dangerous selectors, escalate
  const dangerousSelectors = ['0x095ea7b3', '0x23b872dd', '0xa9059cbb'];
  const selector = calldata.slice(0, 10).toLowerCase();
  const base = scenarios[idx];
  if (dangerousSelectors.includes(selector) && base.threatLevel === 'safe') {
    return JSON.stringify(scenarios[0]);
  }
  return JSON.stringify(base);
}

function buildAnalysisPrompt(
  contractAddress: string,
  calldata: string,
  value: string,
  fromAddress: string,
): string {
  const selector = calldata.slice(0, 10);
  const knownSelectors: Record<string, string> = {
    '0x095ea7b3': 'approve(address,uint256)',
    '0xa22cb465': 'setApprovalForAll(address,bool)',
    '0x23b872dd': 'transferFrom(address,address,uint256)',
    '0xa9059cbb': 'transfer(address,uint256)',
    '0x38ed1739': 'swapExactTokensForTokens',
    '0x7ff36ab5': 'swapExactETHForTokens',
    '0x18cbafe5': 'swapExactTokensForETH',
    '0xbaa2abde': 'removeLiquidity',
    '0x02751cec': 'removeLiquidityETH',
  };

  const functionName = knownSelectors[selector] ?? `unknown (${selector})`;

  return `Analyze this pending Ethereum transaction for security threats:

CONTRACT ADDRESS: ${contractAddress}
CALLER: ${fromAddress}
FUNCTION CALLED: ${functionName}
ETH VALUE: ${value} ETH
CALLDATA (hex): ${calldata.slice(0, 200)}${calldata.length > 200 ? '...' : ''}

Additional context:
- This transaction is currently pending in the mempool
- The caller's wallet is being monitored for security threats
- Flag any patterns indicative of approval scams, rug pulls, honeypots, or liquidity attacks

Respond ONLY with a valid JSON object matching the specified schema.`;
}

export async function analyzeContract(
  contractAddress: string,
  calldata: string,
  value: string,
  fromAddress: string,
): Promise<ContractAnalysis> {
  const provider = detectProvider();
  const prompt = buildAnalysisPrompt(contractAddress, calldata, value, fromAddress);

  let raw: string;
  try {
    if (provider === 'anthropic') {
      console.log('[Analyzer] Using Anthropic claude-opus-4-5');
      raw = await analyzeWithAnthropic(prompt);
    } else if (provider === 'openai') {
      console.log('[Analyzer] Using OpenAI gpt-4o');
      raw = await analyzeWithOpenAI(prompt);
    } else {
      console.log('[Analyzer] No API key found — using mock analysis');
      raw = mockAnalysis(contractAddress, calldata);
    }
  } catch (err) {
    console.error('[Analyzer] AI call failed, falling back to mock:', err);
    raw = mockAnalysis(contractAddress, calldata);
  }

  const parsed = JSON.parse(raw) as {
    threatLevel: ThreatLevel;
    categories: ThreatCategory[];
    confidence: number;
    reasoning: string;
    indicators: string[];
    recommendation: string;
  };

  return {
    contractAddress,
    threatLevel: parsed.threatLevel,
    categories: parsed.categories ?? [],
    confidence: parsed.confidence ?? 50,
    reasoning: parsed.reasoning ?? '',
    indicators: parsed.indicators ?? [],
    recommendation: parsed.recommendation ?? '',
    analysisTimestamp: Date.now(),
  };
}
