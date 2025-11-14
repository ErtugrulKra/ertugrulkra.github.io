---
title: Token-Oriented Object Notation – A More Efficient Data Format for LLMs
description: How the TOON format reduces token usage in LLM prompts and why it outperforms JSON for repetitive data structures.
author: Ertugrul Kara
pubDate: 2025-11-14
tags:
  - LLM
  - TOON
  - Token Optimization
  - JSON Alternatives
lang: en
---

# Token-Oriented Object Notation: A More Efficient Data Format for LLMs

When building applications with Large Language Models (LLMs), token usage is a critical factor for both cost and performance. We pay for every token, and the model's context window is limited. That's why it's important to keep the data we send to LLMs as compact as possible.

While JSON is widely used, it can be quite inefficient, especially for repetitive structures. Having to send field names over and over again for each object causes unnecessary token usage. This is where Token-Oriented Object Notation (TOON) format comes in.

## What is TOON?

TOON (Token-Oriented Object Notation) is a compact, schema-aware data serialization format optimized for LLMs. It can transmit the same information using 30-60% fewer tokens compared to JSON.

The main advantage of TOON is that it uses a tabular format for repetitive structures. In arrays of objects with the same fields, it defines field names only once and streams the values as rows.

## Why TOON?

In traditional JSON format, we have to repeat all field names for each object:

```json
{
  "products": [
    {"sku": "A123", "name": "Widget", "price": 9.99},
    {"sku": "B456", "name": "Gadget", "price": 19.99},
    {"sku": "C789", "name": "Thingy", "price": 5.99}
  ]
}
```

This example uses about 45 tokens. We can represent the same data in TOON format like this:

```
products[3]{sku,name,price}:
  A123,Widget,9.99
  B456,Gadget,19.99
  C789,Thingy,5.99
```

This format uses only 19 tokens - a 58% savings. As the dataset grows, the savings increase even more.

## py-toon-format: Python Implementation

The `py-toon-format` package for the Python ecosystem makes it easy to use the TOON format. The package provides a JSON-like API, so you can use it in your existing code with minimal changes.

### Installation

```bash
pip install py-toon-format
```

If you want more accurate token counting for LLM integration:

```bash
pip install py-toon-format[llm]
```

### Basic Usage

Using TOON is very similar to JSON:

```python
from py_toon_format import encode, decode

# Convert Python objects to TOON format
data = {
    "products": [
        {"sku": "A123", "name": "Widget", "price": 9.99},
        {"sku": "B456", "name": "Gadget", "price": 19.99}
    ]
}

toon_string = encode(data)
print(toon_string)
# products[2]{sku,name,price}:
#   A123,Widget,9.99
#   B456,Gadget,19.99

# Convert TOON format back to Python objects
decoded_data = decode(toon_string)
assert decoded_data == data  # True
```

### File Operations

You can read and write files similar to the JSON module:

```python
from py_toon_format import load, dump

# Read from file
data = load("data.toon")

# Write to file
dump(data, "output.toon")
```

### Measuring Token Savings

You can use the `compare_sizes` function to measure your actual token savings:

```python
from py_toon_format import compare_sizes

data = {
    "products": [
        {"id": i, "name": f"Product {i}", "price": i * 10.0}
        for i in range(100)
    ]
}

metrics = compare_sizes(data)
print(f"Token reduction: {metrics['token_reduction']:.1f}%")
print(f"Size reduction: {metrics['size_reduction']:.1f}%")
```

## LLM Integration

The real power of TOON shows up in LLM applications. It provides significant cost savings when sending large datasets to LLMs.

### Using with OpenAI API

```python
from py_toon_format import prepare_for_llm, compare_sizes
import openai

# Large dataset
data = {
    "products": [
        {"id": i, "name": f"Product {i}", "price": i * 10.0}
        for i in range(1000)
    ]
}

# Check token savings
metrics = compare_sizes(data)
print(f"Token reduction: {metrics['token_reduction']:.1f}%")

# Prepare for LLM API
payload = prepare_for_llm(
    data,
    system_prompt="You are a data analyst",
    user_prompt="Analyze these products and identify trends"
)

# Send to OpenAI
response = openai.ChatCompletion.create(
    model="gpt-4",
    **payload
)
```

The `prepare_for_llm` function converts the data to TOON format and wraps it in a code block that the model can understand. This way, the model processes the data more efficiently.

### Processing LLM Responses

You can easily process TOON-formatted responses from LLMs:

```python
from py_toon_format import extract_from_llm_response, create_llm_prompt
import openai

# Create prompt
prompt = create_llm_prompt(
    {"items": [{"id": 1, "name": "Widget"}]},
    "Filter items and return as TOON format",
    format_instruction=True
)

# LLM call
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}]
)

# Extract TOON data
result_data = extract_from_llm_response(response)
print(result_data)
```

## Command Line Interface

The package also includes a CLI tool for quick conversions:

```bash
# Convert JSON to TOON
py-toon encode input.json -o output.toon

# Convert TOON to JSON
py-toon decode input.toon -o output.json

# Using stdin/stdout
echo '{"key": "value"}' | py-toon encode
cat data.toon | py-toon decode
```

## Format Details

The TOON format is optimized for different data structures:

### Simple Objects

```python
{"id": 1, "name": "Alice"}
# →
# id: 1
# name: Alice
```

### Nested Objects

```python
{"user": {"id": 1, "name": "Alice"}}
# →
# user:
#   id: 1
#   name: Alice
```

### Tabular Arrays (TOON's Strong Point)

For arrays of objects with the same fields, a tabular format is used:

```python
{
  "items": [
    {"id": 1, "qty": 5},
    {"id": 2, "qty": 3}
  ]
}
# →
# items[2]{id,qty}:
#   1,5
#   2,3
```

### Primitive Arrays

```python
{"tags": ["foo", "bar"]}
# →
# tags[2]: foo,bar
```

### Mixed Arrays

For arrays containing different types of elements, a list format is used:

```python
{"items": [1, {"a": 1}, "x"]}
# →
# items[3]:
#   - 1
#   - a: 1
#   - x
```

## When to Use TOON?

TOON is especially advantageous in these situations:

- Uniform arrays: Large arrays of objects with the same fields
- LLM prompts: When token cost matters
- Large datasets: Large datasets with consistent structure

Situations where TOON is less effective:

- Deeply nested structures: JSON might be more suitable
- Varying field sets: When each object has different fields
- API responses: Standard JSON is more appropriate
- Data storage: JSON is more common and supported

## Real World Scenario

Let's say you want to analyze 1000 products with an LLM in an e-commerce application:

```python
from py_toon_format import prepare_for_llm, compare_sizes
import openai

# Product data
products = {
    "items": [
        {
            "id": i,
            "name": f"Product {i}",
            "category": f"Category {i % 10}",
            "price": i * 10.0,
            "stock": i * 5,
            "rating": 4.0 + (i % 5) * 0.2
        }
        for i in range(1000)
    ]
}

# Calculate token savings
metrics = compare_sizes(products)
print(f"JSON tokens: {metrics['json_tokens']}")
print(f"TOON tokens: {metrics['toon_tokens']}")
print(f"Savings: {metrics['token_reduction']:.1f}%")

# Send to LLM
payload = prepare_for_llm(
    products,
    user_prompt="Analyze product trends and suggest improvements"
)

response = openai.ChatCompletion.create(
    model="gpt-4",
    **payload
)
```

In this scenario, thanks to the TOON format, you can save thousands of tokens. This is a significant advantage both in terms of cost and context window usage.

## Conclusion

The TOON format is a powerful tool for optimizing token usage in LLM applications. It provides significant savings especially for large datasets containing repetitive structures.

The `py-toon-format` package makes it easy for Python developers to use this format. It provides a JSON-like API, so it can be integrated into your existing code with minimal changes.

If you want to reduce token costs and use the context window more efficiently in your LLM applications, I recommend trying the TOON format and the `py-toon-format` package.

## Resources

- PyPI Package: [py-toon-format](https://pypi.org/project/py-toon-format/)
- GitHub Repository: [ErtugrulKra/py-toon-format](https://github.com/ErtugrulKra/py-toon-format)
- TOON Specification: [toon-format/toon](https://github.com/toon-format/toon)
- Format Documentation: [toonformat.dev](https://toonformat.dev)
