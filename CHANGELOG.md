# Change Log

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