import { generateMnemonic, generate, generateFromPrivateKey } from '../src/lib/wallet_generation_utils';
import { Wallet } from "../src/pages/Popup/DataTypes";
import * as fs from 'fs';
import * as path from 'path';

// Test 1: Generate a new wallet
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

console.log('Generated new wallet:');
console.log('Address:', wallet.address);
console.log('Address starts with D:', wallet.address.startsWith('D'));

// Test 2: Generate wallet from known private key (matching Python test case)
const testPrivateKey = 'be531298d55bba6639cbe813f9d7a82ff5467146c2d0154ca7150ad9d5042aa7';
const expectedAddress = 'DhKfZHgKbkWwLrARdY5PcREbjeQdp65CKMxijGnuZMC5g';

console.log('\nTesting with known private key from Python stellaris-wallet:');
console.log('Private key:', testPrivateKey);
console.log('Expected address:', expectedAddress);

const testWallet = generateFromPrivateKey(testPrivateKey, ['private_key', 'public_key', 'address']);
console.log('Generated address:', testWallet.address);
console.log('Addresses match:', testWallet.address === expectedAddress);
console.log('Generated address starts with D:', testWallet.address.startsWith('D'));

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
