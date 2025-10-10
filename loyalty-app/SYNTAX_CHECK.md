# Syntax Check and Code Quality

This document describes the syntax checking and code quality tools set up for the Customer Loyalty App.

## Overview

The project includes comprehensive syntax checking and code formatting tools to ensure code quality before commits and deployments.

## Available Scripts

### Core Scripts

```bash
# Format code with Prettier
npm run format

# Check formatting without fixing
npm run format:check

# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Check TypeScript types
npm run type-check

# Run comprehensive syntax check
npm run syntax-check
```

### Pre-commit Scripts

```bash
# Run all pre-commit checks (format + syntax check)
npm run pre-commit

# Run all pre-push checks (format + syntax check + build)
npm run pre-push
```

## Syntax Checker

The `check-syntax.js` script performs comprehensive checks:

### What it checks:

- ✅ **File Syntax**: Individual TypeScript/JavaScript file syntax
- ✅ **TypeScript Compilation**: Full TypeScript type checking
- ✅ **ESLint**: Code quality and style rules
- ✅ **Prettier**: Code formatting consistency

### Features:

- 🔍 **Smart File Discovery**: Automatically finds all relevant files
- 📁 **Directory Scanning**: Checks `src/`, `public/`, and `scripts/` directories
- 🚫 **Exclusion Rules**: Skips `node_modules`, `.next`, and other build directories
- 📏 **File Size Limits**: Skips files larger than 1MB
- ⚠️ **Warning System**: Reports non-critical issues
- 📊 **Detailed Reporting**: Shows exactly what failed and how to fix it

### Usage:

```bash
# Run syntax check manually
npm run syntax-check

# Or run the script directly
node check-syntax.js
```

## Git Hooks

### Pre-commit Hook

Automatically runs before each commit:

1. Formats code with Prettier
2. Runs syntax check
3. Runs TypeScript type check

### Pre-push Hook

Automatically runs before each push:

1. Runs all pre-commit checks
2. Builds the project to ensure compilation

## Configuration Files

### ESLint (`.eslintrc.json`)

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "no-console": "off",
    "no-unused-vars": "off",
    "no-trailing-spaces": "off",
    "comma-dangle": "off",
    "curly": "off",
    "react/no-unescaped-entities": "off"
  }
}
```

### Prettier (`.prettierrc`)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## Workflow Integration

### Before Committing

```bash
# Manual pre-commit check
npm run pre-commit
```

### Before Pushing

```bash
# Manual pre-push check
npm run pre-push
```

### CI/CD Integration

The syntax checker can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run Syntax Check
  run: npm run syntax-check
```

## Troubleshooting

### Common Issues

1. **ESLint Errors**

   ```bash
   npm run lint:fix
   ```

2. **Prettier Formatting Issues**

   ```bash
   npm run format
   ```

3. **TypeScript Errors**

   ```bash
   npm run type-check
   ```

4. **Build Failures**
   ```bash
   npm run build
   ```

### Fixing Issues

The syntax checker provides helpful error messages and suggests fixes:

```bash
🔧 To fix issues:
   npm run lint:fix    # Fix ESLint issues
   npm run format      # Fix Prettier formatting
   npm run type-check # Check TypeScript types
```

## File Exclusions

The syntax checker automatically excludes:

- `node_modules/`
- `.next/`
- `.git/`
- `dist/`
- `build/`
- `coverage/`
- `*.d.ts`
- `*.min.js`
- `*.bundle.js`
- Files larger than 1MB

## Performance

- ⚡ **Fast**: Only checks relevant files
- 🎯 **Targeted**: Focuses on source code directories
- 📏 **Efficient**: Skips large files and build artifacts
- 🔄 **Parallel**: Runs checks concurrently where possible

## Integration with IDEs

### VS Code

Install these extensions for best experience:

- ESLint
- Prettier
- TypeScript Importer

### Recommended Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Continuous Integration

The syntax checker is designed to work seamlessly with CI/CD:

```bash
# In your CI pipeline
npm ci
npm run syntax-check
npm run build
```

This ensures that:

- All code passes syntax checks
- TypeScript compilation succeeds
- ESLint rules are followed
- Code is properly formatted
- The project builds successfully

## Best Practices

1. **Run checks locally** before committing
2. **Fix issues immediately** when they're found
3. **Use the automated hooks** to prevent bad commits
4. **Keep dependencies updated** for latest linting rules
5. **Configure your IDE** to show linting errors in real-time

## Support

If you encounter issues with the syntax checker:

1. Check the error messages for specific guidance
2. Run individual checks to isolate issues:
   ```bash
   npm run lint
   npm run type-check
   npm run format:check
   ```
3. Review the configuration files for custom rules
4. Check that all dependencies are installed: `npm install`
