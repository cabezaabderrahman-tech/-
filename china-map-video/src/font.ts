import "@fontsource-variable/noto-sans-sc";
import { cancelRender, continueRender, delayRender } from "remotion";

// Noto Sans SC ships with the bundle (Fontsource, OFL-1.1), so rendering needs
// no font server. It is split into ~100 unicode-range chunks; the browser only
// fetches the chunks containing characters that are actually on screen.

const FAMILY = "Noto Sans SC Variable";
export const FONT_STACK = `'${FAMILY}', 'PingFang SC', 'Microsoft YaHei', sans-serif`;

const requested = new Set<string>();

/** Blocks rendering until every glyph in `text` is available. */
export const loadChineseFont = (text: string): string => {
  if (!requested.has(text)) {
    requested.add(text);
    const handle = delayRender(`Loading ${FAMILY} for "${text.slice(0, 24)}"`);
    document.fonts
      .load(`700 48px "${FAMILY}"`, text)
      .then(() => continueRender(handle))
      .catch((err) => cancelRender(err));
  }
  return FONT_STACK;
};
