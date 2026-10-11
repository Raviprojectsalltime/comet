import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const articles = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'knowledge.json'), 'utf-8')
);

// Intent categories → regex triggers. Order matters: specific before general.
const INTENTS = [
  { id: 'water-damage', re: /wet|water|rain|soak|drench|puddle|damp|moist/i },
  { id: 'mould-fungus', re: /fungus|mould|mold|mildew|smell|odou?r|green.*patch|white.*substance/i },
  { id: 'cleaning', re: /clean|wash|detergent|dirty|stain|scrub|soap|machine/i },
  { id: 'color-fading', re: /fad(e|ing)|colou?r.*(bleed|chang|fading)|bleed|discolou?r|patch|white marks?/i },
  { id: 'material-texture', re: /rough|smooth|texture|peel|hard|stiff|material|surface|fabric feel/i },
  { id: 'sole-structure', re: /sole|stitch|crack|separat|came off|detach|shape.*chang|glue/i },
  { id: 'fit-size', re: /tight|fit|size|sizing|hurt|uncomfort|loose|too (small|big|narrow|wide)|pain/i },
  { id: 'arrived-damaged', re: /arrived?.*(damag|defect|broken)|defect|tear|torn|rip(ped)?|broke|damaged?/i },
  { id: 'product-mismatch', re: /different|wrong (product|item|pair|model)|mismatch|not as (described|shown)|another/i },
  { id: 'missing-wrong-item', re: /missing|wrong (size|colou?r)|empty box|package.*damag/i },
  { id: 'cancel-address', re: /cancel|address.*(change|edit|correct)|change.*address/i },
  { id: 'returns-refunds', re: /return|exchange|refund|money ?back|swap/i },
  { id: 'payment-refund-query', re: /payment|paid|charged|deducted|upi|card|transaction|debited/i },
  { id: 'delivery-tracking', re: /deliver|track|where.*order|delay|shipping|package|dispatch|courier|arrive|status/i },
  { id: 'shoe-care', re: /care|maintain|protect|store|storage|waterproof|spray|preserve/i },
  { id: 'product-info', re: /price|cost|buy|pre-?order|hukum|launch|recommend|compare|new|drop|which/i },
];

const GREETING = /\b(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/i;
const THANKS = /thank|great|awesome|nice|perfect/i;
const AFFIRM = /^(yes|yeah|yep|sure|it worked|resolved|fixed|that helped)/i;

function overlapScore(article, text) {
  const lower = text.toLowerCase();
  return article.keywords.reduce(
    (s, k) => (lower.includes(k.toLowerCase()) ? s + 1 : s),
    0
  );
}

// Combine the current message with recent user messages for context.
export function answer({ message, history = [], product }) {
  const text = String(message || '');
  const contextText =
    text +
    ' ' +
    history
      .filter((m) => m.from === 'user')
      .slice(-4)
      .map((m) => m.text || '')
      .join(' ');

  if (GREETING.test(text) && text.length < 40) {
    return {
      reply: "Hey Cometeer! I'm the Comet help bot. Ask me about product issues, shoe care, delivery, returns — anything.",
      category: 'greeting',
      resolvable: false,
    };
  }
  if (THANKS.test(text) && !AFFIRM.test(text) && text.length < 60) {
    return {
      reply: 'Happy to help! Anything else on your mind?',
      category: 'thanks',
      resolvable: false,
    };
  }

  // Find intent category (current message first, then context).
  let intent = INTENTS.find((i) => i.re.test(text));
  if (!intent) intent = INTENTS.find((i) => i.re.test(contextText));

  // Retrieve the best matching knowledge article.
  let article = intent ? articles.find((a) => a.id === intent.id) : null;
  if (!article) {
    let best = null;
    let bestScore = 0;
    for (const a of articles) {
      const s = overlapScore(a, contextText);
      if (s > bestScore) {
        best = a;
        bestScore = s;
      }
    }
    if (bestScore >= 2) article = best;
  }

  const productNote = product ? ` (regarding your ${product.silhouette} ${product.title})` : '';

  if (article) {
    return {
      reply: article.answer + productNote,
      followUp: article.followUp || null,
      category: article.category,
      articleId: article.id,
      resolvable: true,
      escalateIfUnresolved: article.escalateIfUnresolved,
    };
  }

  // Clarifying prompts when intent is known but vague.
  if (intent?.id === 'delivery-tracking' || /order/i.test(text)) {
    return {
      reply:
        'I can help with that — could you share your order number? If you\'re logged in, I can also pull up your recent orders.',
      category: 'clarify',
      resolvable: false,
    };
  }

  // No reliable knowledge — do NOT invent an answer. Offer escalation.
  return {
    reply:
      "I want to make sure you get the right answer rather than a guess — this one needs our support team. Would you like me to send this conversation to Comet customer support? They'll follow up on email.",
    category: 'unknown',
    offerEscalation: true,
    resolvable: false,
  };
}

// Build the escalation email per the PRD's required structure.
export function buildEscalationEmail({ email, product, history = [], category }) {
  const now = new Date();
  const ticket = `CMT-${now.getTime().toString(36).toUpperCase()}`;
  const userMsgs = history.filter((m) => m.from === 'user' && m.text);
  const botMsgs = history.filter((m) => m.from === 'bot' && m.text);
  const images = history.filter((m) => m.image).length;

  const transcript = history
    .map((m) => `${m.from === 'user' ? 'Customer' : 'Bot'}: ${m.text || '[image attached]'}`)
    .join('\n');

  const subject = `Comet Customer Support – ${category || 'General Query'} – ${ticket}`;

  const productLines = product
    ? [
        `- Product: ${product.silhouette} ${product.title} (${product.color || 'n/a'})`,
        `- Variant: UK ${product.size || 'n/a'} · ₹${product.price || 'n/a'}`,
        product.orderId ? `- Order: ${product.orderId}` : null,
        product.orderDate ? `- Purchased: ${new Date(product.orderDate).toLocaleDateString('en-IN')}` : null,
        product.orderStatus ? `- Order status: ${product.orderStatus}` : null,
      ].filter(Boolean)
    : ['- Product: not specified'];

  const body = [
    'Hello Customer Support Team,',
    '',
    'A customer has requested assistance with an issue that could not be resolved through the chatbot.',
    '',
    'Customer details',
    `- Customer email: ${email}`,
    '',
    'Product and order details',
    ...productLines,
    '',
    'Issue details',
    `- Issue category: ${category || 'General'}`,
    userMsgs.length ? `- Original query: "${userMsgs[0].text}"` : '- See conversation below.',
    `- Reason for escalation: ${unresolvedReason(category)}`,
    images ? `- Attachments: ${images} customer-uploaded image(s)` : null,
    '',
    'Actions taken',
    botMsgs.length
      ? `The chatbot provided ${botMsgs.length} response(s), including: "${botMsgs[botMsgs.length - 1].text.slice(0, 200)}"`
      : 'No automated resolution was available.',
    '',
    'Conversation history',
    transcript,
    '',
    'Requested action',
    'Please review the issue and contact the customer with the appropriate next steps under Comet policies.',
    '',
    `Ticket: ${ticket}`,
    `Escalated at: ${now.toLocaleString('en-IN')}`,
    '',
    'Regards,',
    'Comet AI Customer Support',
  ]
    .filter((l) => l !== null)
    .join('\n');

  return { ticket, subject, body };
}

function unresolvedReason(category) {
  if (category === 'unknown') return 'No reliable answer in the approved knowledge base';
  if (category) return `Issue remained unresolved after guided troubleshooting (${category})`;
  return 'Customer requested human assistance';
}
