const REPLIES = [
  'Got it. For a 5-day Lisbon trip on a mid budget, I would split it as two days in the city (Alfama, Belém, Time Out Market), one day in Sintra, one day on the Cascais coast, and a final wind-down day for the Lx Factory and a sunset at Miradouro da Senhora do Monte. Want me to slot in food picks per day?',
  'Yes, you can hit Kyoto and Osaka in the same week without it feeling rushed. Three nights in Kyoto for the temples and the Arashiyama bamboo grove, then two nights in Osaka for the food and a day trip to Nara. Shinkansen between them is under fifteen minutes once you are at the station.',
  'For Goa in October you are at the tail end of the monsoon, which means cheaper stays and very green hills, but some shacks on the beaches will still be closed. North Goa (Assagao, Vagator) skews boutique and quiet that month. South Goa is dreamier but spread out — only go if you want to truly slow down.',
  'A weekend in Pondicherry pairs well with a half-day in Auroville and one early morning at Paradise Beach. Stay in the French Quarter for the architecture. Skip Rock Beach for swimming, it is a promenade not a beach. Best cafes cluster on Rue Suffren and Rue Romain Rolland.',
  'For Bali on ten days I would do three nights in Ubud for the rice fields and the day hikes, three nights in Canggu for the surf and cafes, and the rest split between Uluwatu cliffs and the Nusa islands. Skip Kuta unless you specifically want nightlife — it has aged poorly.',
];

let cursor = 0;

function pickReply(): string {
  const reply = REPLIES[cursor % REPLIES.length];
  cursor += 1;
  return reply;
}

function tokenize(text: string): string[] {
  //split words into tokens with trailing space (except last token)
  const tokens: string[] = [];
  const parts = text.split(' ');
  for (let i = 0; i < parts.length; i += 1) {
    tokens.push(i === parts.length - 1 ? parts[i] : `${parts[i]} `);
  }
  return tokens;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const FIRST_TOKEN_DELAY_MIN_MS = 600;
const FIRST_TOKEN_DELAY_MAX_MS = 1400;

export async function* mockStreamReply(
  _prompt: string,
): AsyncGenerator<string, void, void> {
  //simulare network delay before the first token arrives
  await delay(
    FIRST_TOKEN_DELAY_MIN_MS +
      Math.random() * (FIRST_TOKEN_DELAY_MAX_MS - FIRST_TOKEN_DELAY_MIN_MS),
  );
  const tokens = tokenize(pickReply());
  for (const token of tokens) {
    // simulate delay for each token
    await delay(30 + Math.random() * 60);
    yield token;
  }
}
