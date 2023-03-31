import {
  Denops,
  ensureNumber,
  ensureString,
  execute,
  mapping,
  Mode,
} from "./deps.ts";
import { getBuildOption, getMessage } from "./helper.ts";

export async function main(denops: Denops): Promise<void> {
  // わからない
  const maps = [
    {
      lhs: "<silent> <Plug>(Slack)",
      rhs: ":Slack<CR>",
      mode: ["n", "v"],
    },
  ];

  for (const map of maps) {
    await mapping.map(denops, map.lhs, map.rhs, {
      mode: map.mode as Mode[],
    });
  }
  denops.dispatcher = {
    async post(start: unknown, end: unknown, text: unknown): Promise<unknown> {
      // 絶対に[始まりの行, 終わりの行]
      // テキストがある場合 [始まりの行, 終わりの行, テキスト]
      const { message, isPlane } = await getMessage(
        denops,
        ensureNumber(start),
        ensureNumber(end),
        ensureString(text),
      );

      const option = await getBuildOption(denops);

      const data = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${option.token}`
        },
        cache: 'no-cache',
        body: JSON.stringify({
          "model": "gpt-3.5-turbo",
          "messages": [{"role": "user", "content": message}]
        })
      }).then(res => res.json())

      const buf = await denops.call('nvim_create_buf', false, true)
      await denops.call('nvim_buf_set_lines', buf, 0, -1, true, [`Q. ${message}`, ...data.choices.map(v => v.message.content)])
      denops.call("nvim_open_win", buf, true, {
        'style': 'minimal', 
        'relative': 'editor',
        'width': 30,
        'height': 30,
        'row': 1, 
        'col': 1,
      })

      
      return true;
    },
  };

  // -range: 範囲選択できるように
  // -nargs: 引数の数
  // line1, line2: 選択している最初の行と最後の行
  // q-args: 良い感じにエスケープして文字を受け取る
  await execute(
    denops,
    `command! -range -nargs=? Chatgpt call denops#request('${denops.name}', 'post', [<line1>, <line2>, <q-args>])`,
  );
}
