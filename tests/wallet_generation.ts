import { generateMnemonic, generate } from '../src/lib/wallet_generation_utils';
import { Wallet } from "../src/pages/Popup/DataTypes";
import * as fs from 'fs';

const mnemonic: string = generateMnemonic();
const wallet: Wallet = generate({
    mnemonicPhrase: mnemonic,
    passphrase: '',
    index: 0,
    deterministic: false,
    fields: ['mnemonic', 'id', 'private_key', 'public_key', 'address'],
    walletVersion: '0.2.3'
});
wallet.name = "TEST WALLET";

const outputData = {
    wallet_data: {
        wallet_type: "non-deterministic",
        version: "0.2.3",
        entry_data: {
            entries: [
                {
                    id: "1",
                    mnemonic: wallet.mnemonic,
                    private_key: wallet.private_key,
                    public_key: wallet.public_key,
                    address: wallet.address
                }
            ]
        }
    }
};

const outputDir = path.join(__dirname, 'test_wallets');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
const outputPath = path.join(outputDir, `${wallet.name}.json`);
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 4), 'utf8');
