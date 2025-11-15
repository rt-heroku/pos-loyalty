#!/bin/bash

# Script to add 'export const dynamic = 'force-dynamic';' to all API routes

find src/app/api -name "route.ts" -type f | while read file; do
  # Check if the file already has the dynamic export
  if ! grep -q "export const dynamic" "$file"; then
    echo "Fixing $file"
    
    # Add the export after the imports
    # Find the last import line and add the export after it
    awk '
      /^import / { last_import = NR }
      { lines[NR] = $0 }
      END {
        for (i = 1; i <= NR; i++) {
          print lines[i]
          if (i == last_import) {
            print ""
            print "// Force dynamic rendering"
            print "export const dynamic = '\''force-dynamic'\'';"
          }
        }
      }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  else
    echo "Skipping $file (already has dynamic export)"
  fi
done

echo "Done!"

