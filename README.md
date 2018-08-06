# Pandoc Citer Extension for Visual Studio Code

This extension provides autocompletion of citations stored in a bibtex file. 

## Features

### Autocomplete citations

![Example of citation autocomplete](imgs/exmplCiter.gif)

- Citations follow the standard syntax recognized by [pandoc-citeproc](https://github.com/jgm/pandoc-citeproc), i.e.: 
    - Citation syntax: `@BibKey` or `[@bibKey]`
    - The YAML should contain the line 
    ```
    bibliography: [path/to/.bib]
    ```
    - The path/to/.bib should be enclosed by square brackets
    - Multiple bib files can be included if separated by comma

## Acknowledgements

- The autocomplete for citations was based on the [LaTeX-Workshop extension](https://github.com/James-Yu/LaTeX-Workshop)  

## Release Notes

### 0.0.1

Initial release of PandocCiter


