# spl-token 代币基本操作
1. 创建 Mint 账户   `create_mint`
2. 创建 Token 代币账户 `create_token_account`
3. 账户铸币  `mint_tokens`
4. 转账  `transfer_tokens`


## 编译部署
```shell
$ anchor build
$ anchor deploy
```

## 单元测试
```shell
$ anchor test
```

## 说明
由于 IDL 生成的脚本有些系统账户是固定的值，如 `systemProgram` 的值`11111111111111111111111111111111`、`associatedTokenProgram` 的值`ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL`等, 同样有些账户是是通过 PDA 生成的，如本示例中的 `tokenAccount` 等，它也是依赖于其它字段来生成的，这些字段值的定义可以在生成的 IDL 文件里找到，因此在单元测试中调用指令时，并不需要手动传入这些值，它会在执行时自动填充。如果你使用vscode开发的话，在指定这些字段的时候，编辑器里会提示警告信息，但不影响执行。

但有一个特殊的情况需要注意：
如果在 beta.solpg.io 网站执行单元测试脚本的话，则有些字段它是无法省略的， 如上面的 tokenAccount，它需要手动传入，否则会报错。 

## 其它说明

如果在项目中用到了 anchor-spl 库的话，需要引入依赖并配置 IDL：
```toml

[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"] # 2. 添加 "anchor-spl/idl-build" 特性

[dependencies]
anchor-spl = "0.30.1"  # 1. 引入 anchor-spl 库
anchor-lang = { version = "0.30.1", features = ["init-if-needed"] }
```

## 参考资料
- https://www.anchor-lang.com/docs/tokens/basics
- https://github.com/solana-developers/program-examples/tree/main/tokens/token-2022