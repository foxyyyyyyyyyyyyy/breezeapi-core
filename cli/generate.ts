import { promises as fs } from 'fs';
import path from 'path';

const templatesDir = path.resolve(__dirname, 'templates');
const apiDir = path.resolve(__dirname, '../src/api'); // Updated to use src/api

async function generate(type: 'route' | 'socket', userInput: string) {
    try {
        const templateFile = path.join(templatesDir, `${type}-template.ts`);
        const targetDir = path.join(apiDir, userInput);
        const targetFile = path.join(targetDir, `${type}.ts`);

        // Ensure the target directory exists
        await fs.mkdir(targetDir, { recursive: true });

        // Copy the template file to the target location
        await fs.copyFile(templateFile, targetFile);

        console.log(`✔ ${type} created at: ${targetFile}`);
    } catch (error) {
        console.error(`Error generating ${type}:`, error);
    }
}

// Parse CLI arguments
const [,, command, type, userInput] = process.argv;

if (command === 'g' || command === 'generate') {
    if (type === 'route' || type === 'socket') {
        if (!userInput) {
            console.error('Error: Please provide a route path.');
        } else {
            generate(type, userInput);
        }
    } else {
        console.error('Error: Invalid type. Use "route" or "socket".');
    }
} else {
    console.error('Error: Invalid command. Use "g" or "generate".');
}
