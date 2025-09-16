import { parse as parseJS } from "@babel/parser";
import type { Expression, ObjectProperty } from "@babel/types";
import t from "@babel/types";
import type { Token } from "parse5";
import parseStyleString from "style-to-object";
import {
  coerceToBooleanAttributes,
  eventHandlerAttributes,
  lowercasedAttributes,
  numberAttributes,
  renamedAttributes,
  styleDontStripPx,
  svgCamelizedAttributes,
  svgCoerceToBooleanAttributes,
} from "./attributes.ts";

// Export function to convert HTML attribute name to JSX attribute name
export function convertAttributeNameToJSX(htmlName: string): string {
  // Check renamed attributes
  for (const [html, jsx] of renamedAttributes) {
    if (html === htmlName) {
      return jsx;
    }
  }
  
  // Check event handler attributes
  for (const jsxAttribute of eventHandlerAttributes) {
    if (htmlName === jsxAttribute.toLowerCase()) {
      return jsxAttribute;
    }
  }
  
  // Check lowercased attributes
  for (const jsxAttribute of lowercasedAttributes) {
    if (htmlName === jsxAttribute.toLowerCase()) {
      return jsxAttribute;
    }
  }
  
  // Check SVG camelized attributes
  for (const [jsxAttribute] of svgCamelizedAttributes) {
    if (htmlName === jsxAttribute) {
      return camelize(htmlName);
    }
  }
  
  return htmlName;
}

export function convertAttributes(attributes: Token.Attribute[]) {
  return attributes.map(({ name: attributeName, value: attributeValue }) => {
    if (attributeName === "style") {
      return createJSXAttribute(
        "style",
        convertStyleToObjectExpression(attributeValue),
      );
    }

    for (const [htmlName, jsxName] of renamedAttributes) {
      if (htmlName === attributeName) {
        return createJSXAttribute(jsxName, attributeValue);
      }
    }

    for (const jsxAttribute of eventHandlerAttributes) {
      if (attributeName === jsxAttribute.toLowerCase()) {
        return functionizeAttribute(jsxAttribute, attributeValue);
      }
    }

    for (const jsxAttribute of svgCoerceToBooleanAttributes) {
      if (attributeName === jsxAttribute) {
        return booleanizeAttribute(jsxAttribute, attributeValue);
      }
    }

    for (const jsxAttribute of coerceToBooleanAttributes) {
      if (attributeName === jsxAttribute.toLowerCase()) {
        return booleanizeAttribute(
          jsxAttribute,
          attributeValue,
          new Set(["checked", "disabled", "selected", "value"]),
        );
      }
    }

    for (const jsxAttribute of numberAttributes) {
      if (attributeName === jsxAttribute.toLowerCase()) {
        const numberValue = Number(attributeValue);

        if (Number.isFinite(numberValue)) {
          return createJSXAttribute(jsxAttribute, numberValue);
        } else {
          return createJSXAttribute(jsxAttribute, attributeValue);
        }
      }
    }

    for (const [jsxAttribute, isNumeric] of svgCamelizedAttributes) {
      if (attributeName === jsxAttribute) {
        const camelizedName = camelize(attributeName);

        if (isNumeric) {
          const numberValue = Number(attributeValue);

          if (Number.isFinite(numberValue)) {
            return createJSXAttribute(camelizedName, numberValue);
          }
        }

        return createJSXAttribute(camelizedName, attributeValue);
      }
    }

    for (const jsxAttribute of lowercasedAttributes) {
      if (attributeName === jsxAttribute.toLowerCase()) {
        return createJSXAttribute(jsxAttribute, attributeValue);
      }
    }

    return createJSXAttribute(attributeName, attributeValue);
  });
}

// Matches a px value, e.g. `40px`
const MATCH_PX_VALUE = /^(\d+)px$/;

function convertStyleToObjectExpression(style: string) {
  const properties: Array<ObjectProperty> = [];

  parseStyleString(style, (name, value) => {
    // Don't remove `px` where this changes the meaning of the attribute value
    const canStripPx = !styleDontStripPx.includes(name.toLowerCase());
    const pxValueMatch = value.match(MATCH_PX_VALUE);
    properties.push(
      t.objectProperty(
        t.identifier(camelize(name)),
        pxValueMatch !== null && canStripPx
          ? t.numericLiteral(Number(pxValueMatch[1]))
          : t.stringLiteral(value),
      ),
    );
  });

  return t.objectExpression(properties);
}

const CAMELIZE = /[\-\:]([a-z])/g;
const capitalize = (token: string) => token[1]!.toUpperCase();

const IS_CSS_VARIBLE = /^--\w+/;

/**
 * Converts kebab-case or colon:case to camelCase
 */
export function camelize(string: string) {
  // Skip the attribute if it is a css variable.
  // It looks something like this: style="--bgColor: red"
  if (IS_CSS_VARIBLE.test(string)) return `"${string}"`;
  return string.replace(CAMELIZE, capitalize);
}

/**
 * @param trueLiterals A list of values that should preserve the
 *   jsxExpressionContainer when true, e.g. checked={true} insted of just
 *   checked.
 */
function booleanizeAttribute(
  name: string,
  value: string,
  trueLiterals?: Set<string>,
) {
  if (name === "value" && value === "") {
    return createJSXAttribute(name, value);
  }

  if (value === "" || value === "true" || value === name.toLowerCase()) {
    if (trueLiterals?.has(name)) {
      return createJSXAttribute(name, t.booleanLiteral(true));
    }

    return createJSXAttribute(name, null);
  } else if (value === "false") {
    return createJSXAttribute(name, t.booleanLiteral(false));
  }

  return createJSXAttribute(name, value);
}

// Matches function calls in an event handler attribute, e.g.
// onclick="myFunction()".
const EMPTY_FUNCTION_CALL = /^\s*([\p{L}_\$][\p{L}_\$]*)\(\)\s*$/u;

function functionizeAttribute(attributeName: string, attributeValue: string) {
  const functionCallMatch = attributeValue.match(EMPTY_FUNCTION_CALL);

  if (functionCallMatch !== null) {
    return createJSXAttribute(
      attributeName,
      t.identifier(functionCallMatch[1]!),
    );
  }

  try {
    const innerCode = parseJS(attributeValue);

    return createJSXAttribute(
      attributeName,
      t.arrowFunctionExpression(
        [t.identifier("event")],
        t.blockStatement(innerCode.program.body),
      ),
    );
  } catch {
    const codeTemplateLiteral = t.expressionStatement(
      t.templateLiteral([t.templateElement({ raw: attributeValue })], []),
    );
    t.addComment(
      codeTemplateLiteral,
      "leading",
      " TODO: Fix event handler code",
      true,
    );

    return createJSXAttribute(
      attributeName,
      t.arrowFunctionExpression(
        [t.identifier("event")],
        t.blockStatement([codeTemplateLiteral]),
      ),
    );
  }
}

function createJSXAttribute(
  name: string,
  value: string | number | Expression | null,
) {
  if (value === null) {
    return t.jsxAttribute(t.jsxIdentifier(name), null);
  }

  switch (typeof value) {
    case "string":
      return t.jsxAttribute(t.jsxIdentifier(name), t.stringLiteral(value));
    case "number":
      return t.jsxAttribute(
        t.jsxIdentifier(name),
        t.jsxExpressionContainer(t.numericLiteral(value)),
      );
    default:
      return t.jsxAttribute(
        t.jsxIdentifier(name),
        t.jsxExpressionContainer(value),
      );
  }
}
