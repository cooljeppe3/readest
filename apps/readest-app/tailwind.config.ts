import type { Config } from 'tailwindcss';
import { themes } from './src/styles/themes';
import daisyui from 'daisyui';
/**
 * Configuration file for Tailwind CSS.
 * Tailwind is a utility-first CSS framework that provides a comprehensive set of CSS classes.
 */
const config: Config = {
  // The 'content' array specifies the paths to all of the files that Tailwind should scan for class names.
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // The 'safelist' array ensures that specific Tailwind classes are always included in the final CSS, even if they are not directly found by Tailwind's scanner.
  // This is useful for classes generated dynamically or those not directly visible in the source code.
  safelist: [
    // Include all classes starting with `bg-` (e.g., bg-red-500, bg-blue-200).
    { pattern: /bg-./ },
    // Include all classes starting with `text-` (e.g., text-lg, text-center).
    { pattern: /text-./ },
    // Include all classes starting with `fill-` (e.g., fill-current, fill-blue-500).
    { pattern: /fill-./ },
    // Include all classes starting with `decoration-` (e.g., decoration-2, decoration-wavy).
    { pattern: /decoration-./ },
    // Include all classes starting with `tooltip-` (e.g., tooltip-open, tooltip-top).
    { pattern: /tooltip-./ },
  ],
  // The 'theme' section is where you customize Tailwind's default design tokens.
  theme: {
    // The 'extend' section allows you to add to the default theme without overriding it.
    extend: {
      // Custom colors defined in the theme. Using CSS variables for dynamic theming.
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  // The 'plugins' array allows you to include Tailwind plugins that add more features or utility classes.
  plugins: [daisyui],
  // Configuration for the DaisyUI plugin. DaisyUI provides a set of pre-styled components.
  daisyui: {
    themes: themes.reduce(
      (acc, { name, colors }) => {
        acc.push({
          [`${name}-light`]: colors.light,
        });
        acc.push({
          [`${name}-dark`]: colors.dark,
        });
        return acc;
      },
      ['light', 'dark'] as (Record<string, unknown> | string)[],
    ),
  }
};
// Export the Tailwind configuration for use in the project.
export default config;
