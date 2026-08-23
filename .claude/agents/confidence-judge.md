# 確信度判定プロンプト

## 目的
FAQ ボットの回答が、どの程度信頼できるか判定する

## 入力
- `user_question`: ユーザーからの質問
- `bot_answer`: ボットが生成した回答
- `faq_data`: FAQ データベースの内容（関連データ）

## 判定基準

### 🟢 高確信度（High）
- FAQ に完全にマッチする回答
- 複数の FAQ データで確認できる
- ユーザーの質問と回答が直接一致

### 🟡 中確信度（Medium）
- 部分的に FAQ に関連している
- ユーザーの質問が FAQ と少し異なるが、回答は適用可能
- 一定の推論や解釈が含まれている

### 🔴 低確信度（Low）
- FAQ データに該当するものがない
- ユーザーの質問が複雑で、簡単に答えられない
- オーナーの人間的判断が必要

## 出力フォーマット

```json
{
  "confidence_level": "高 | 中 | 低",
  "confidence_score": 0.0～1.0,
  "reasoning": "判定理由（簡潔に）",
  "should_escalate": true/false,
  "escalation_reason": "低確信度の場合、なぜ人間の判断が必要か"
}
```

## 使用例

**入力:**
```
user_question: "営業時間は？"
bot_answer: "営業時間は9:00～18:00です"
faq_data: [
  {"q": "営業時間を教えてください", "a": "9:00～18:00です"},
  {"q": "いつ営業していますか？", "a": "9:00～18:00"}
]
```

**出力:**
```json
{
  "confidence_level": "高",
  "confidence_score": 0.95,
  "reasoning": "FAQ と完全にマッチしている",
  "should_escalate": false
}
```

## Claude API プロンプト本体

```
あなたは FAQ ボットの回答品質を判定するエキスパートです。

以下の情報をもとに、ボットの回答の確信度を判定してください：

【ユーザーの質問】
{user_question}

【ボットの回答】
{bot_answer}

【参考 FAQ データ】
{faq_data}

【判定基準】
- 高：FAQ に完全にマッチ、複数ソースで確認可能
- 中：部分的に関連、推論や解釈を含む
- 低：FAQ にない、複雑で人間の判断が必要

以下の JSON 形式で判定してください：
{
  "confidence_level": "高 | 中 | 低",
  "confidence_score": 0.0～1.0,
  "reasoning": "判定理由",
  "should_escalate": true/false,
  "escalation_reason": "低確信度の場合の理由"
}
```
