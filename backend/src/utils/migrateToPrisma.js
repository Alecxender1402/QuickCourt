#!/usr/bin/env node

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the backend root directory (go up from src/utils to backend root)
const backendRoot = path.resolve(__dirname, '../..');

// Models that need to be converted
const modelMappings = {
  'User.js': 'UserPrisma.js',
  'Venue.js': 'VenuePrisma.js',
  'Booking.js': 'BookingPrisma.js',
  'Review.js': 'ReviewPrisma.js',
  'Court.js': 'CourtPrisma.js',
  'TimeSlot.js': 'TimeSlotPrisma.js',
};

// Controllers that need to be converted
const controllerMappings = {
  'authController.js': 'authControllerPrisma.js',
  'venueController.js': 'venueControllerPrisma.js',
  'bookingController.js': 'bookingControllerPrisma.js',
  'reviewController.js': 'reviewControllerPrisma.js',
  'adminController.js': 'adminControllerPrisma.js',
  'courtController.js': 'courtControllerPrisma.js',
  'timeSlotController.js': 'timeSlotControllerPrisma.js',
  'publicController.js': 'publicControllerPrisma.js',
  'paymentController.js': 'paymentControllerPrisma.js',
  'notificationController.js': 'notificationControllerPrisma.js',
  'customerBookingController.js': 'customerBookingControllerPrisma.js',
};

// Function to convert import statements in a file
async function convertImports(filePath, mappings) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    let updatedContent = content;

    // Convert model imports
    Object.entries(mappings).forEach(([oldName, newName]) => {
      const importRegex = new RegExp(
        `import\\s+([\\w\\s,{}]+)\\s+from\\s+['"\`]([^'"\`]*${oldName.replace('.js', '')})['"\`]`,
        'g'
      );
      updatedContent = updatedContent.replace(importRegex, (match, imports, path) => {
        const newPath = path.replace(oldName.replace('.js', ''), newName.replace('.js', ''));
        return `import ${imports} from '${newPath}'`;
      });
    });

    return updatedContent;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

// Function to convert a single file
async function convertFile(filePath, mappings, outputPath = null) {
  const updatedContent = await convertImports(filePath, mappings);

  if (updatedContent === null) {
    return false;
  }

  const targetPath = outputPath || filePath.replace('.js', 'Prisma.js');

  try {
    await fs.writeFile(targetPath, updatedContent);
    console.log(`✅ Converted: ${filePath} -> ${targetPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error writing file ${targetPath}:`, error.message);
    return false;
  }
}

// Function to show migration status
async function showMigrationStatus() {
  console.log('\n📊 Migration Status:\n');

  const modelsPath = path.join(backendRoot, 'src', 'models');
  const controllersPath = path.join(backendRoot, 'src', 'controllers');

  console.log('🔧 Models:');
  for (const [oldName, newName] of Object.entries(modelMappings)) {
    const oldPath = path.join(modelsPath, oldName);
    const newPath = path.join(modelsPath, newName);

    const oldExists = await fs
      .access(oldPath)
      .then(() => true)
      .catch(() => false);
    const newExists = await fs
      .access(newPath)
      .then(() => true)
      .catch(() => false);

    const status = newExists ? '✅' : '⏳';
    console.log(`  ${status} ${oldName} -> ${newName} ${newExists ? '(Ready)' : '(Pending)'}`);
  }

  console.log('\n🎛️  Controllers:');
  for (const [oldName, newName] of Object.entries(controllerMappings)) {
    const oldPath = path.join(controllersPath, oldName);
    const newPath = path.join(controllersPath, newName);

    const oldExists = await fs
      .access(oldPath)
      .then(() => true)
      .catch(() => false);
    const newExists = await fs
      .access(newPath)
      .then(() => true)
      .catch(() => false);

    const status = newExists ? '✅' : '⏳';
    console.log(`  ${status} ${oldName} -> ${newName} ${newExists ? '(Ready)' : '(Pending)'}`);
  }
}

// Function to switch imports in a specific file
async function switchFileImports(filePath, toPrisma = true) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    let updatedContent = content;

    if (toPrisma) {
      // Switch to Prisma models
      Object.entries(modelMappings).forEach(([oldName, newName]) => {
        const modelName = oldName.replace('.js', '');
        const prismaModelName = newName.replace('.js', '');

        // Replace import statements
        const importRegex = new RegExp(
          `import\\s+${modelName}\\s+from\\s+['"\`]([^'"\`]*/)${modelName}(\\.js)?['"\`]`,
          'g'
        );
        updatedContent = updatedContent.replace(
          importRegex,
          `import ${modelName} from '$1${prismaModelName}.js'`
        );

        // Could also replace usage if needed
        // updatedContent = updatedContent.replace(new RegExp(`\\b${modelName}\\.`, 'g'), `${prismaModelName}.`);
      });
    } else {
      // Switch back to original models
      Object.entries(modelMappings).forEach(([oldName, newName]) => {
        const modelName = oldName.replace('.js', '');
        const prismaModelName = newName.replace('.js', '');

        // Replace import statements back
        const importRegex = new RegExp(
          `import\\s+${modelName}\\s+from\\s+['"\`]([^'"\`]*/)${prismaModelName}(\\.js)?['"\`]`,
          'g'
        );
        updatedContent = updatedContent.replace(
          importRegex,
          `import ${modelName} from '$1${modelName}.js'`
        );
      });
    }

    await fs.writeFile(filePath, updatedContent);
    console.log(`✅ Switched imports in ${filePath} to ${toPrisma ? 'Prisma' : 'original'} models`);
    return true;
  } catch (error) {
    console.error(`❌ Error switching imports in ${filePath}:`, error.message);
    return false;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'status':
      await showMigrationStatus();
      break;

    case 'switch':
      const target = args[1]; // 'auth', 'venue', etc.
      const toPrisma = args[2] !== 'back';

      if (!target) {
        console.log('Usage: npm run migrate switch <controller> [back]');
        console.log('Example: npm run migrate switch auth');
        console.log('Example: npm run migrate switch auth back');
        return;
      }

      const controllerPath = path.join(backendRoot, 'src', 'controllers', `${target}Controller.js`);
      await switchFileImports(controllerPath, toPrisma);
      break;

    case 'help':
    default:
      console.log(`
🚀 Prisma Migration Helper

Available commands:
  status           Show migration status of all models and controllers
  switch <name>    Switch a controller to use Prisma models
  switch <name> back  Switch a controller back to original models
  help            Show this help message

Examples:
  npm run migrate status
  npm run migrate switch auth
  npm run migrate switch venue back

Migration Strategy:
1. Models are already converted to Prisma versions (UserPrisma.js, etc.)
2. Use 'switch' command to gradually convert controllers one by one
3. Test each conversion before moving to the next
4. Use 'back' option to revert if issues are found

Recommended Order:
1. auth (authentication)
2. venue (venue management)
3. booking (booking system)
4. review (review system)
5. admin (admin functions)
      `);
      break;
  }
}

if (process.argv[1] === __filename) {
  main().catch(console.error);
}

export { convertFile, switchFileImports, showMigrationStatus };
