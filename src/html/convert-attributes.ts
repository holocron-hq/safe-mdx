import type { Token } from "parse5";
import {
  coerceToBooleanAttributes,
  eventHandlerAttributes,
  lowercasedAttributes,
  numberAttributes,
  renamedAttributes,
  styleDontStripPx,
  svgCamelizedAttributes,
  svgCoerceToBooleanAttributes,
} from "./attributes.js";

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