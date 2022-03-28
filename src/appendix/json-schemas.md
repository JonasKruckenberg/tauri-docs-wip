# D - JSON Schemas

## Dynamic JSON Format

<figure>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "additionalProperties": false,
  "required": ["url", "version"],
  "properties": {
    "url": { "type": "string" },
    "version": { "type": "string" },
    "pub_date": { "type": "string" },
    "notes": { "type": "string" },
    "signature": { "type": "string" }
  }
}
```

<figcaption>Listing D-1: Formal schema for the updater's dynamic JSON format.</figcaption>
</figure>

## Static JSON Format

<figure>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "additionalProperties": false,
  "required": ["version"],
  "properties": {
    "version": { "type": "string" },
    "pub_date": { "type": "string" },
    "notes": { "type": "string" },
    "platforms": {
      "type": "object",
      "additionalProperties": false,
      "patternProperties": {
        "^(linux|windows|darwin)-(x86_64|i686|aarch64|armv7)$": {
          "type": "object",
          "required": ["url"],
          "properties": {
            "url": { "type": "string" },
            "signature": { "type": "string" },
            "with_elevated_task": { "type": "boolean" }
          }
        }
      }
    }
  }
}
```

<figcaption>Listing D-2: Formal schema for the updater's static JSON format.</figcaption>
</figure>
