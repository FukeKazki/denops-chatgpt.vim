import { Denops } from "./deps.ts"

export const newWindow = (denops: Denops) => {
  denops.cmd("vnew")
      // await denops.call("setline", 1, `Q. ${message}`)
      // await denops.call("setline", 2, `A. ${data.choices.map(v => v.message.content).join('')}`);
}
