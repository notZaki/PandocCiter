# Change Log

## [0.9.4] - 2022-05-15

- The bibliography paths in the YAML header no longer need to be enclosed in square brackets (issue #32)
- The `DefaultBib` configuration now supports multi-root workspaces (issue #31)

## [0.9.3] - 2022-05-14

- Added support for citations in quarto[https://marketplace.visualstudio.com/items?itemName=quarto.quarto] documents

## [0.9.2] - 2021-12-15

- Hovering and go-to support ( #29 - thanks to @Dominic-DallOsto )
  - Hovering over a citation will now show relevant information (e.g. author & title)
  - Ctrl+clicking a citation will now open the bibtex file and go to the line where the entry was defined

## [0.9.1] - 2021-11-03

- Added support for pandoc-crossref crossreferences ( #26 - thanks to @yarray )

## [0.9.0] - 2021-04-16

- Use `documentation` instead of `detail` property for suggestions
  + This should fix incorrect newlines in intellisense (issue #21)

## [0.8.0] - 2021-03-16

- Add support for `Pweave Markdown` files

## [0.7.0] - 2020-03-17

- Remove support for `${workspaceFolder}` in bib path
- If the path in `PandocCiter.DefaultBib` is relative, then it will be assumed that the path is relative to the workspaceFolder

## [0.6.0] - 2020-03-17

- Support `${workspaceFolder}` in bib path (#13)

## [0.5.0] - 2020-03-17

- Switch to [latex-utensils](https://www.npmjs.com/package/latex-utensils) on the backend to support custom BibEntries (#12)

## [0.4.2] - 2020-03-11

- Fix UseDefaultBib with relative path ( #11 - @smartens )

## [0.4.1] - 2019-11-16

- Added a config option which can disable the 'forgetting' feature added in 0.4.0
    + For example, if a project has multiple markdown files where the bibliography should be shared but only one file has a YAML header, then setting `PandocCiter.ForgetUnusedBib: false` will allow the citation suggestions to appear in all of the markdown files.
- Added a language check when the text editor is changed. 
   + Otherwise, the extension forgets all of the citations whenever a non-markdown file was opened which is unnecessary. 

## [0.4.0] - 2019-11-16

- Fixed an issue where quoted paths were not recognized correctly
- Extension should now forget suggestions from bib files which are removed from the `bibliography` field

## [0.3.8] - 2019-09-12

- Update to lighter dependencies

## [0.3.7] - 2019-05-08

- Minor update to dependancies becuase of upstream security warnings

## [0.3.6] - 2019-03-06

- The completion provider terminates itself if it isn't triggered by an `@`.
    + The completion provider was being executed for any typed character because intellisense is aggressive by default. Although not a big deal, it does mean that unnecessary computations are done for each keystroke. This update attempts to avoid the extra computation by terminating the function early if an `@` is not detected.
        * There might be a good reason for intellisense's aggressiveness that I'm unaware of. Remains to be seen if this update breaks the completions for any users.

## [0.3.5] - 2019-03-04

- Feature: Check if any duplicate keys exist when parsing a bib file

## [0.3.3-4] - 2019-02-11

- For debugging: Add log event when providing suggestions

## [0.3.2] - 2019-01-11

- Fixes:
    + When `PandocCiter.ViewType` was set to `"browser"`, the inserted citation would be placed in a selected state. This was a problem because typing any character would erase the inserted citation, e.g. `@insertedKey` would become `@ ` if the space bar is pressed. Updated version should now deselect the citation as soon as it is done inserting it.
    + The suggestions would pop-up as long as any `@key` exists on the line. This is because the regex searched for the suggestion trigger along the entire line, so any instance of a citation would lead to citation suggested throughout the line. Updated version should now only search for the citation trigger in the most recent word before the cursor instead of the entire line.  

## [0.3.1] - 2018-11-28

- Updated vscode module to avoid [potential security issue](https://code.visualstudio.com/blogs/2018/11/26/event-stream) with the event-stream package.

## [0.2.0 & 0.3.0] - 2018-11-14

- [0.3.0] Add configuration `PandocCiter.DefaultBib` and `PandocCiter.UseDefaultBib`
    + `PandocCiter.DefaultBib` should be an absolute path to a bib file. This file will always be loaded in any markdown document without requiring a YAML entry.
- [0.2.0] Add support for `-@key` syntax

## [0.1.4] - 2018-11-09

- Bib files will be searched on file save
    + Previously, the text document had to be closed/re-opened whenever `bibliography: [./path/to/refs]` was updated

## [0.1.3 & 0.1.2 & 0.1.1] - 2018-10-11

- Fix citations not being highlighted when inside square brackets in vscode 1.28

## [0.1.0] - 2018-10-10

- Change `pandoc.citation` scope to `string.other.link.description.markdown.citation`
    + Citations should now be automatically hi-lighted by most (all?) themes
- Add support for R-Markdown documents

## [0.0.9] - 2018-10-05

- Remove disallowed punctuation from citation scope

## [0.0.8] - 2018-10-05

- Recognize citation scope when a reference is at the beginning of a new line

## [0.0.7] - 2018-10-04

- Consolidate the two citation scopes into a single scope

## [0.0.6] - 2018-10-03

- Add "pandoc.citation" scope for references: https://github.com/notZaki/PandocCiter/issues/1

## [0.0.5] - 2018-09-24

- Enable `awaitWriteFinish` on file watcher. This might introduce a short delay before a modified .bib file is parsed, but it prevents .bib files from getting partially parsed when they are still being written to disk.
- Adapted fix from: https://github.com/James-Yu/LaTeX-Workshop/pull/817
    + Should improve bib parsing speed
- Use newer versions of dependencies

## [0.0.4] - 2018-08-29

- Output channel for the extension log should no longer be created if `PandocCiter.ShowLog` config is false

## [0.0.3] - 2018-08-28

- Extension log can now be viewed in the output panel
- Fixed relative path in RootFile being incorrectly resolved relative to the Workplace Directory instead of the RootFile's directory
- Allow RootFile to either be a relative or absolute path

## [0.0.2] - 2018-08-08 

- Added configuration for ViewType and RootFile

## [0.0.1] - 2018-08-06 

- Initial release