// Read at call time — .env is loaded by index.js after this module is
// evaluated, so module-level constants would always be undefined.
const conf = () => ({
  key: process.env.EDEN_API_KEY,
  url: process.env.EDEN_API_URL || 'https://api.edenai.run/v3/chat/completions',
  model: process.env.EDEN_MODEL || 'gpt-4.1-nano-2025-04-14',
});

const SYSTEM_RULES = `You are Comet Support, the customer support assistant for Comet — an Indian homegrown sneaker brand (wearcomet.com).

STRICT RULES — follow them exactly:
- Answer ONLY using the APPROVED KNOWLEDGE and CUSTOMER DATA provided below. Never invent policies, tracking updates, refund statuses, warranty promises, or product details that are not stated there.
- If the provided information does not answer the question, say the issue needs the human support team and suggest escalating — do not guess.
- Be warm, concise and practical: 2-4 short sentences plus the key next step. Use "you/your" and the customer's context (their product, order) when relevant.
- Never ask for passwords, card details, or OTPs.
- Distinguish facts from possibilities (e.g. white patches may be mildew — do not declare a defect).
- If a follow-up question is listed for the article, end your reply by asking it naturally.
- Prices: X Lows ₹4,299+, Aeon V2 ₹4,499+, Aeres ₹5,299+, Hukum ₹5,899. Support email: hello@wearcomet.com, WhatsApp +91 9606081463.`;

// Generic one-shot LLM call — used for dashboard insights.
export async function llmText(systemPrompt, userPrompt) {
  const { key, url, model } = conf();
  if (!key) return null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      }),
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

// Call the LLM with the grounded context. Returns reply text or null on failure.
export async function llmReply({ article, message, history, product, orders, email, image }) {
  const { key, url, model } = conf();
  if (!key) return null;

  const context = [];
  if (article) {
    context.push(
      `APPROVED KNOWLEDGE — ${article.title} (category: ${article.category}):\n${article.answer}` +
        (article.followUp ? `\nSuggested follow-up question: ${article.followUp}` : '')
    );
  }
  if (product) {
    context.push(
      `SELECTED PRODUCT: ${product.silhouette} ${product.title} — ${product.color || ''}, ₹${product.price}`
    );
  }
  if (orders?.length) {
    const list = orders
      .slice(0, 5)
      .map(
        (o) =>
          `- ${(o.items || []).map((i) => `${i.title} (${i.silhouette}, UK ${i.size})`).join(', ')} — ₹${o.total}, ordered ${new Date(o.created_at).toLocaleDateString('en-IN')}`
      )
      .join('\n');
    context.push(`CUSTOMER'S RECENT ORDERS (verified):\n${list}`);
  }
  if (email) context.push(`Customer is logged in as ${email}.`);

  const messages = [
    { role: 'system', content: SYSTEM_RULES + '\n\n' + context.join('\n\n') },
    ...history
      .filter((m) => m.text)
      .slice(-8)
      .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })),
    // Vision: send the uploaded photo alongside the question so the model
    // can comment on visible issues (tear, sole separation, discolouration).
    image
      ? {
          role: 'user',
          content: [
            { type: 'text', text: `${message}\n\nThe customer uploaded this photo of the product. Describe only what is visibly relevant, do not declare a defect or refund eligibility.` },
            { type: 'image_url', image_url: { url: image } },
          ],
        }
      : { role: 'user', content: message },
  ];

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'x-edenai-metadata': 'enabled',
      },
      body: JSON.stringify({ model, messages, stream: false }),
    });
    clearTimeout(t);
    if (!res.ok) {
      console.error('Eden AI error:', res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const data = await res.json();
    return (
      data?.choices?.[0]?.message?.content?.trim() ||
      data?.result?.generated_text?.trim() ||
      null
    );
  } catch (e) {
    console.error('Eden AI call failed:', e.message);
    return null;
  }
}
