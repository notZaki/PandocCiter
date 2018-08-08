# Pandoc Citer Extension for Visual Studio Code

This extension provides autocompletion of citations stored in a bibtex file, for use with [pandoc-markdown](https://pandoc.org/) documents. 

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
    - Multiple bib files can be included if separated by comma, e.g. `[path/to/refsA.bib, path/to/refsB.bib]

### Configuration

- `PandocCiter.ViewType`
    + Type: String, either "inline" (default) or "browser"
    + Function: Changes how the suggested citations are shown
- `PandocCiter.RootFile`
    + Type: String, relative path to markdown file
    + Function: This is useful if there are multiple markdown files with one external master file containing the YAML header with the `bibliography: [path/to/bib]` entry. This avoids having to insert the bibliography YAML header into each individual file. 

## Acknowledgements

- This extension is essentially a stripped down version of the [LaTeX-Workshop extension](https://github.com/James-Yu/LaTeX-Workshop) that has been repurposed for markdown/pandoc.  
