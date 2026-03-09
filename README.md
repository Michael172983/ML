# 🛡️ On-chain Security Guardian

Web3 × AI を融合させた自律型セキュリティエージェント。メンプールをリアルタイム監視し、AI が脅威を即座に判定、危険を検知した場合は資産を自動退避させます。

---

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                          │
│                                                                       │
│  ┌─────────────────┐          ┌──────────────────────────────────┐  │
│  │  MetaMask        │ wagmi/   │      React Dashboard             │  │
│  │  (Wallet)        │◄────────►│  Tailwind CSS + Lucide + RainbowKit│ │
│  └─────────────────┘ viem     └──────────┬───────────────────────┘  │
└─────────────────────────────────────────┼───────────────────────────┘
                                           │ WebSocket (ws://)
                                           │ REST API (http://)
┌─────────────────────────────────────────▼───────────────────────────┐
│                     SECURITY GUARDIAN AGENT                          │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   SecurityGuardian (guardian.ts)                │ │
│  │  - Orchestrates monitor, analyzer, and evacuation              │ │
│  │  - Threat threshold filtering                                  │ │
│  │  - Event broadcasting via WebSocket                            │ │
│  └───────────────┬────────────────────┬───────────────────────────┘ │
│                  │                    │                               │
│  ┌───────────────▼──────┐  ┌─────────▼────────────────────────────┐ │
│  │  MempoolMonitor       │  │  AI Analyzer (analyzer.ts)           │ │
│  │  (monitor.ts)         │  │                                       │ │
│  │  - WebSocket RPC sub  │  │  Providers (priority order):         │ │
│  │  - Block polling FB   │  │  1. Anthropic Claude (claude-opus)   │ │
│  │  - Mock tx injection  │  │  2. OpenAI GPT-4o                    │ │
│  └───────────────┬───────┘  │  3. Mock (deterministic demo)        │ │
│                  │           │                                       │ │
│                  │           │  Detects:                            │ │
│                  │           │  • Approval Scams                    │ │
│                  │           │  • Rug Pulls                         │ │
│  ┌───────────────▼──────┐    │  • Honeypots                         │ │
│  │  Ethereum / EVM       │    │  • Liquidity Drains                  │ │
│  │  (viem)               │    │  • Flash Loan Attacks               │ │
│  │  - Sepolia / Mainnet  │    │  • Phishing Contracts               │ │
│  │  - Pending Tx Watch   │    └──────────────────────────────────────┘ │
│  └──────────────────────┘                                            │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Evacuation Engine (guardian.ts: simulateEvacuation)           │ │
│  │  - Enumerates wallet assets (ETH + ERC-20 + ERC-721)           │ │
│  │  - Builds transfer transactions                                 │ │
│  │  - Sets gas = attacker_gas × 1.2 (frontrun strategy)          │ │
│  │  - Sends to pre-configured Safety Wallet                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 機能一覧

| 機能 | 説明 |
|------|------|
| **リアルタイム監視** | WebSocket RPC 経由でメンプール（Pending Tx）を監視。フォールバックとしてブロックポーリングも対応 |
| **AI脅威検知** | Anthropic Claude / OpenAI GPT-4o がコントラクトのバイトコード・カルデータを解析し脅威を判定 |
| **自動資金退避** | HIGH/CRITICAL 脅威検知時、攻撃者ガス代 ×1.2 でフロントラン、セーフティウォレットへ転送をシミュレート |
| **ダッシュボード** | 防御ステータス・脅威フィード・退避履歴をリアルタイム表示 |
| **デモシミュレーター** | API キー不要で動作するモック攻撃シナリオ（Approval詐欺・ラグプル・不審転送）注入機能 |

---

## ディレクトリ構成

```
onchain-security-guardian/
├── frontend/                   # React ダッシュボード
│   ├── src/
│   │   ├── components/
│   │   │   ├── DefenseStatus.tsx       # 防御ステータスパネル
│   │   │   ├── GuardianConfig.tsx      # 設定・ウォレット接続
│   │   │   ├── ThreatFeed.tsx          # 脅威フィード
│   │   │   ├── DemoPanel.tsx           # デモシミュレーター
│   │   │   ├── ArchitectureDiagram.tsx # アーキテクチャ図
│   │   │   ├── ThreatBadge.tsx
│   │   │   └── ShieldIcon.tsx
│   │   ├── hooks/
│   │   │   ├── useGuardianWS.ts    # WebSocket 接続フック
│   │   │   └── useGuardianApi.ts   # REST API クライアント
│   │   ├── lib/wagmi.ts            # Wagmi / RainbowKit 設定
│   │   ├── types/index.ts
│   │   └── App.tsx
│   └── package.json
│
└── backend/                    # TypeScript エージェント
    ├── src/
    │   ├── agent/
    │   │   ├── guardian.ts     # コアオーケストレーター
    │   │   ├── monitor.ts      # メンプール監視
    │   │   └── analyzer.ts     # AI 脅威分析
    │   ├── api/
    │   │   └── server.ts       # Express + WebSocket サーバー
    │   ├── types/index.ts
    │   └── index.ts
    └── package.json
```

---

## セットアップ & 起動

### 必要環境
- Node.js 18+
- npm 9+

### 1. バックエンド

```bash
cd backend

# 環境変数を設定
cp .env.example .env
# .env を編集して API キー・RPC URL を設定

# 依存関係インストール
npm install

# 開発サーバー起動（ホットリロード対応）
npm run dev
# → http://localhost:3001
```

**環境変数**

| 変数 | 必須 | 説明 |
|------|------|------|
| `ANTHROPIC_API_KEY` | いずれか1つ | Anthropic Claude API キー |
| `OPENAI_API_KEY` | いずれか1つ | OpenAI API キー |
| `RPC_WS_URL` | 推奨 | Alchemy/Infura WebSocket URL |
| `RPC_HTTP_URL` | フォールバック | HTTP RPC URL |
| `PORT` | 任意 | サーバーポート（デフォルト: 3001）|

> **API キー未設定でも動作します** — モック分析エンジンが現実的なシナリオを生成します。

### 2. フロントエンド

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

**環境変数（任意）**

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

---

## API リファレンス

### REST

| Method | Path | 説明 |
|--------|------|------|
| `GET`  | `/api/health` | ヘルスチェック |
| `GET`  | `/api/status` | ガーディアン稼動状態 |
| `POST` | `/api/guardian/start` | 監視開始 |
| `POST` | `/api/guardian/stop` | 監視停止 |
| `POST` | `/api/guardian/config` | 設定更新 |
| `GET`  | `/api/threats` | 脅威履歴取得 |
| `GET`  | `/api/evacuations` | 退避履歴取得 |
| `POST` | `/api/demo/simulate-attack` | デモ攻撃注入 |

### WebSocket イベント (`ws://localhost:3001`)

| イベント | ペイロード |
|---------|-----------|
| `status_update` | `GuardianStatus` |
| `threat_detected` | `ThreatEvent` |
| `evacuation_triggered` | `EvacuationSimulation` |
| `guardian_started` | `GuardianStatus` |
| `guardian_stopped` | `GuardianStatus` |

---

## デモの使い方

1. `backend` と `frontend` を両方起動
2. ブラウザで `http://localhost:5173` を開く
3. **"Activate Guardian"** ボタンでガーディアン起動（ウォレット接続なしでも可）
4. **Demo Simulator** パネルから攻撃シナリオを選択して実行
5. Threat Feed に AI 分析結果と退避シミュレーションが表示される

---

## 本番実装への拡張ポイント

- **秘密鍵管理**: AWS KMS / HashiCorp Vault でガーディアンの署名キーを管理
- **実際のオンチェーン退避**: `simulateEvacuation` を実際のトランザクション送信に置き換え
- **Flashbots Protect**: MEV ボットへの対抗として Flashbots RPC を使用
- **Tenderly フォーク**: 退避トランザクションの事前シミュレーション
- **通知**: Telegram / Discord Bot で脅威アラートを送信

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | React 18, Vite, Tailwind CSS, Lucide React |
| Web3 | viem, wagmi v2, RainbowKit |
| Backend | Node.js, TypeScript, Express |
| AI | Anthropic Claude / OpenAI GPT-4o |
| Real-time | WebSocket (ws) |
| Blockchain | Ethereum, Sepolia Testnet |
