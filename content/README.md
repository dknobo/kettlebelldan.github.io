# Content

Markdown for Exclusive and Digest. The site reads these folders at build time.

## Folders

- `exclusive/` long-form from YouTube
- `digest/` daily social pulse

## Frontmatter

Required: `title`, `date`, `slug`, `excerpt`, `tags`.

Optional:

- `members: true` keeps the file off public routes (404, noindex). There is no members gate.
- `example: true` marks a renderer stub. It is not treated as a published article.

`date` is `YYYY-MM-DD`.

## YAML

Do not use `\"` escapes. If a title contains double quotes, use a single-quoted scalar:

```yaml
title: 'He said "no mercy. only iron."'
```

Inside a single-quoted scalar, a literal single quote is written as `''`.

## Publishing

Drop a `.md` file in the folder. Public, non-example files show up on the index and in the homepage slot. Members files stay in git and stay off the public site.
