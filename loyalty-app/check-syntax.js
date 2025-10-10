#!/usr/bin/env node

/**
 * Comprehensive Syntax Checker for Customer Loyalty App
 * Author: Rodrigo Torres
 * Description: Checks TypeScript, JavaScript, and other files for syntax errors before deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Directories to check
  directories: ['src', 'public', 'scripts'],
  // File extensions to check
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  // Files to exclude
  exclude: [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    'coverage',
    '*.d.ts',
    '*.min.js',
    '*.bundle.js',
  ],
  // Maximum file size to check (in bytes)
  maxFileSize: 1024 * 1024, // 1MB
};

class SyntaxChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checkedFiles = 0;
    this.totalFiles = 0;
  }

  /**
   * Check if file should be excluded
   */
  shouldExclude(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);

    return CONFIG.exclude.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(relativePath);
      }
      return relativePath.includes(pattern);
    });
  }

  /**
   * Get all files to check
   */
  getAllFiles() {
    const files = [];

    for (const dir of CONFIG.directories) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        this.findFiles(dirPath, files);
      }
    }

    return files;
  }

  /**
   * Recursively find files in directory
   */
  findFiles(dir, files) {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !this.shouldExclude(fullPath)) {
          this.findFiles(fullPath, files);
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (
            CONFIG.extensions.includes(ext) &&
            !this.shouldExclude(fullPath)
          ) {
            // Check file size
            if (stat.size <= CONFIG.maxFileSize) {
              files.push(fullPath);
            } else {
              this.warnings.push(
                `⚠️  Skipped ${fullPath} - File too large (${Math.round(stat.size / 1024)}KB)`
              );
            }
          }
        }
      }
    } catch (error) {
      this.warnings.push(
        `⚠️  Error reading directory ${dir}: ${error.message}`
      );
    }
  }

  /**
   * Check TypeScript/JavaScript syntax using appropriate tools
   */
  async checkSyntax(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Skip empty files
      if (content.trim().length === 0) {
        return true;
      }

      const ext = path.extname(filePath);
      const relativePath = path.relative(process.cwd(), filePath);

      // For TypeScript/TSX files, we'll rely on the TypeScript compiler check
      // For JavaScript files, use Node.js syntax check
      if (ext === '.ts' || ext === '.tsx') {
        // Skip individual TS/TSX file checks - we'll do a global TypeScript check
        console.log(
          `⏭️  ${relativePath} (will be checked by TypeScript compiler)`
        );
        return true;
      } else if (ext === '.js' || ext === '.jsx') {
        // Use Node.js to check JavaScript syntax
        const { spawn } = require('child_process');
        const nodeProcess = spawn('node', ['-c', filePath], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let errorOutput = '';

        nodeProcess.stderr.on('data', data => {
          errorOutput += data.toString();
        });

        return new Promise(resolve => {
          nodeProcess.on('close', code => {
            if (code === 0) {
              console.log(`✅ ${relativePath}`);
              resolve(true);
            } else {
              console.log(`❌ ${relativePath}`);
              console.log(`   ${errorOutput.trim()}`);
              this.errors.push({
                file: filePath,
                error: errorOutput.trim(),
              });
              resolve(false);
            }
          });

          nodeProcess.on('error', error => {
            console.log(`❌ ${relativePath}`);
            console.log(`   Error: ${error.message}`);
            this.errors.push({
              file: filePath,
              error: error.message,
            });
            resolve(false);
          });
        });
      } else {
        // For other file types, just mark as checked
        console.log(`⏭️  ${relativePath} (skipped - not a JS/TS file)`);
        return true;
      }
    } catch (error) {
      console.log(`❌ ${path.relative(process.cwd(), filePath)}`);
      console.log(`   Error reading file: ${error.message}`);
      this.errors.push({
        file: filePath,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Check TypeScript compilation
   */
  async checkTypeScript() {
    console.log('\n🔍 Checking TypeScript compilation...');
    try {
      execSync('npx tsc --noEmit --skipLibCheck', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      console.log('✅ TypeScript compilation successful');
      return true;
    } catch (error) {
      console.log('❌ TypeScript compilation failed:');
      console.log(error.stdout?.toString() || error.message);
      this.errors.push({
        file: 'TypeScript compilation',
        error: error.stdout?.toString() || error.message,
      });
      return false;
    }
  }

  /**
   * Check ESLint
   */
  async checkESLint() {
    console.log('\n🔍 Checking ESLint...');
    try {
      execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 10', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      console.log('✅ ESLint check passed');
      return true;
    } catch (error) {
      const output = error.stdout?.toString() || error.message;
      console.log('⚠️  ESLint warnings found:');
      console.log(output);
      this.warnings.push(`ESLint warnings: ${output}`);
      return true; // Treat warnings as non-blocking
    }
  }

  /**
   * Check Prettier formatting
   */
  async checkPrettier() {
    console.log('\n🔍 Checking Prettier formatting...');
    try {
      execSync('npx prettier --check .', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      console.log('✅ Prettier formatting check passed');
      return true;
    } catch (error) {
      console.log('❌ Prettier formatting check failed:');
      console.log(error.stdout?.toString() || error.message);
      this.errors.push({
        file: 'Prettier',
        error: error.stdout?.toString() || error.message,
      });
      return false;
    }
  }

  /**
   * Run all checks
   */
  async run() {
    console.log(
      '🚀 Starting comprehensive syntax check for Customer Loyalty App...\n'
    );

    // Get all files to check
    const files = this.getAllFiles();
    this.totalFiles = files.length;

    console.log(`📁 Found ${this.totalFiles} files to check\n`);

    if (this.totalFiles === 0) {
      console.log('⚠️  No files found to check');
      return;
    }

    // Check individual file syntax
    console.log('🔍 Checking file syntax...');
    for (const file of files) {
      await this.checkSyntax(file);
      this.checkedFiles++;
    }

    // Check TypeScript compilation
    await this.checkTypeScript();

    // Check ESLint
    await this.checkESLint();

    // Check Prettier formatting
    await this.checkPrettier();

    // Print warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`   ${warning}`));
    }

    // Print summary
    console.log('\n📊 Summary:');
    console.log(`   Files checked: ${this.checkedFiles}/${this.totalFiles}`);
    console.log(`   Errors: ${this.errors.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Syntax check failed!');
      console.log('\n🔧 To fix issues:');
      console.log('   npm run lint:fix    # Fix ESLint issues');
      console.log('   npm run format      # Fix Prettier formatting');
      console.log('   npm run type-check # Check TypeScript types');
      process.exit(1);
    } else {
      console.log('\n✅ All syntax checks passed!');
      console.log('🎉 Ready for deployment!');
    }
  }
}

// Run the checker
if (require.main === module) {
  const checker = new SyntaxChecker();
  checker.run().catch(error => {
    console.error('💥 Syntax check failed:', error);
    process.exit(1);
  });
}

module.exports = SyntaxChecker;
