# Change Log

All notable changes to the "vscode-pt-diagrams" extension will be documented in this file.

## [1.1.2]

- Support for version-ptd: 1.1 schema
    - Renames `Scenario:` to `Sequence:`
    - Allow emojis in `Sequence:` names
    - Removed `Class Relationships:` section
    - Moved `Imports:` section to the top of the file, just under the `Diagram:` section
    - Added the `version-ptd: 1.1` header to the `Diagram:` section to indicate the version of the schema being used.
    - Added better notation for arrows, incl. emoji diamonds and arrow heads e.g.
```
      ----inherits----▷ BaseRecipe
      ⋯⋯⋯implements⋯⋯⋯▷ IRecipe
      ---implements---> IRecipe
      ---implements---|> IRecipe
      ...implements...|> IRecipe
      ◆---contains----> Fruit
      ◇---depends on--> Wheel
```
    
- Added formatter for .ptd files - hit `OPT+SHIFT+F` to format your .ptd files 🎉
- Updated [Official blog page](https://abulka.github.io/blog/2025/01/29/plain-text-diagrams/) on Plain Text Diagrams to reflect the changes in version 1.1 of the schema

## [0.0.4]

- Initial release