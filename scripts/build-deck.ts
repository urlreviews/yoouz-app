import path from 'path';
import { generateInvestorDeck } from '../src/utils/generateInvestorDeck.ts';

async function main() {
  const outputPath = path.resolve(process.cwd(), 'public', 'Yoouz_Investor_Pitch_Memorandum.pdf');
  console.log(`Generating Yoouz Investor Pitch PDF at: ${outputPath}...`);
  try {
    const res = await generateInvestorDeck(outputPath);
    console.log(`SUCCESS! Generated PDF successfully at: ${res}`);
  } catch (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }
}

main();
