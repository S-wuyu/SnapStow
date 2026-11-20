# SnapStow Windows 测试与发布验证

**状态**：测试方案 · 2026-11-21。当前仓库尚无可执行原型，以下为待实现、待运行的验证方案。

默认用现有 Windows 完成开发和测试。Windows Sandbox、虚拟机和第二套 Windows 均为可选环境。只有需要验证机器上确实没有某项依赖，且已有合适环境时，才补做干净系统验证。否则把该项记为待验证。

## 按测试所需的桌面能力分层

| 层 | 执行环境 | 覆盖 |
| --- | --- | --- |
| 规则和文件集成 | 本机普通进程，每次运行使用独立临时目录 | 用合成帧和搜索替身测试 OCR 后处理、文件匹配、同名冲突、部分成功、SQLite 与文件写入恢复。可启动测试子进程注入故障，避免绑定真实热键、启动托盘或读用户下载目录。 |
| 离屏视觉 | 本机离屏渲染固定数据，显式触发 PNG 导出 | 固定时钟、字体、窗口尺寸、主题和缩放。先用几何断言检查布局、命中区和连线锚点，再抽查关键帧截图。基线与实际画面的差异用相同字体和尺度复核。 |
| 发布包冒烟 | 本机普通用户，在新建测试目录解压正式 ZIP | 验证双击、模型加载、归档、数据落点和同机移动。无额外运行库或搜索工具的实测可用符合条件的现有 Windows，或可选的 Sandbox。 |
| 原生交互与恢复 | 当前 Windows 的短时手工测试，加后台故障注入 | 以合成窗口和临时测试热键验证松手焦点、截图、Esc、托盘、拖放和读屏。后台故障注入只操作测试进程与一次性数据。 |
| 显示与性能验收 | 现有 Windows 的空闲时段 | 在可用的屏幕与缩放组合上验证截图和动效，并按 PRD 计时。记录显卡、磁盘负载、缩放和未覆盖的显示组合。 |

### 保证测试过程不打断日常使用

1. **隔离数据。** 每次运行在指定测试盘创建唯一的工作目录，目录内放发布包副本、合成聊天窗口、下载样本和输出。测试启动器给子进程传入独立的 `TEMP`、`TMP` 和应用根目录，确保从软件副本运行。工作树和用户项目目录保持可供日常使用，测试结果仅保存合成图片与脱敏诊断。
2. **隔离进程。** 为测试进程树设置单次超时和 Windows Job Object，使用 `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`。在确认子进程加入 Job 后才开始测试。故障注入只终止自己启动并持有句柄的进程。清理仅处理确认属于本次运行的目录，报告超时和未清理项。[Windows Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)
3. **隔离系统状态。** 在本机用查询替身覆盖 Everything 不可用、超时和索引漏项，保持现有实例和服务配置。用一次性目录覆盖权限和文件占用。确有干净环境时可补测真实依赖组合。使用 Sandbox 时关网并只读映射发布包和合成样本，复制到来宾的可写目录后运行。[Windows Sandbox 配置](https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/windows-sandbox-configure-using-wsb-file)
4. **隔离输入。** 常规自动化使用离屏夹具和应用命令验证状态。真实快捷键、焦点和拖放仅在用户主动开始的本机手工测试中操作合成窗口，测试实例退出后释放临时热键。若已有独立交互会话，可用它补跑需要真实输入的自动化。[UI Automation 控件模式](https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-controlpatternsoverview) · [真实输入的交互桌面要求](https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/ui-automation)

### 用两套参考仓库落实

| 来源 | 实际测试方式 | 移植到 SnapStow 的方法 |
| --- | --- | --- |
| ftop | `FitSweepTests` 遍历窗口尺寸、布局和比例，核对边界与字形。`RenderTests` 只有设置 `FTOP_RENDER_DIR` 后才离屏输出 PNG。`scripts/check.sh` 提供格式、构建和测试的一体化入口。 | 给 440 / 920 DIP、长文件名、拖动中锚点和亮暗主题建离屏夹具。默认跑几何断言，人工评审时再生成关键帧序列。用单个本地入口聚合项目的构建与自动检查。[尺寸测试](https://github.com/Nongfsq/ftop/blob/e81bb65eba519172d48e6635186e1c15a905f6ff/Tests/FtopUITests/FitSweepTests.swift) · [离屏渲染](https://github.com/Nongfsq/ftop/blob/e81bb65eba519172d48e6635186e1c15a905f6ff/Tests/FtopUITests/RenderTests.swift) · [检查脚本](https://github.com/Nongfsq/ftop/blob/e81bb65eba519172d48e6635186e1c15a905f6ff/scripts/check.sh) |
| frun | `TestDir` 将临时目录放在仓库盘并用 `Drop` 清理。`script_hygiene.rs` 检查脚本是否绕过共用运行器。`headless_edge.py` 自管浏览器配置目录和子进程的 `TEMP`，用 Windows Job 收尾。`search.rs` 将本机真实索引的耗时测试标成默认跳过。 | 集中管理测试目录和 Job，常规测试采用合成索引。把需要真实桌面的测试和基准设为单独运行项。Rust 路线可使用同类的 RAII 临时目录辅助件。[目录夹具](https://github.com/Nongfsq/frun/blob/d34f05e98c720974e97cdb9c61c44f090929d54e/src/testdir.rs) · [脚本检查](https://github.com/Nongfsq/frun/blob/d34f05e98c720974e97cdb9c61c44f090929d54e/tests/script_hygiene.rs) · [进程与临时目录](https://github.com/Nongfsq/frun/blob/d34f05e98c720974e97cdb9c61c44f090929d54e/tools/headless_edge.py) · [查询测试与基准](https://github.com/Nongfsq/frun/blob/d34f05e98c720974e97cdb9c61c44f090929d54e/src/search.rs#L169-L292) |

## 发布包验收清单

| 环节 | 操作和预期 |
| --- | --- |
| 双击与资源加载 | 在本机测试目录用普通用户解压 ZIP。双击 `SnapStow.exe`，从另一工作目录启动也能定位本包的 OCR 模型和运行库。另行记录是否覆盖缺少开发环境与额外搜索工具的 Windows。 |
| 数据位置 | 用两个独立的临时目录分别作软件目录和工作总目录。从合成截图走完一次归档，核对截图、设置、SQLite 及其旁文件、缓存和日志在软件目录，附件副本和 Markdown 在用户指定的工作总目录，下载原件留在原处。以进程为范围检查写入路径和注册表访问，区分系统生成的记录与 SnapStow 写入的数据。[Sysinternals Process Monitor](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) |
| 目录权限和移动 | 用带空格和中文的路径运行。退出后只搬软件目录，验证截图和设置可用，同时确认原工作总目录路径与归档材料保持原位。分别覆盖软件目录不可写、工作总目录不可写或暂时不可访问、项目路径联接和目标文件占用。 |
| Everything 组合 | 默认用查询替身验证无实例、只有服务无 GUI 进程、版本或实例不匹配、索引加载中、配置漏索引、同名和陈旧结果。若已有可用实例，可做只读联调。若评估随包的 Everything，再验证命名实例独立启动退出、配置与索引随包留存，并核对已有实例和服务不受影响。 |
| 数据一致性 | 验证附件大文件复制时圈选仍能及时释放。分别在临时文件写入时、目标已发布但 SQLite 未提交时、群迁移部分成功时终止该测试实例。在同一测试目录重新启动，检查重复条目、源文件和待重试任务。 |
| 升级与安全 | 先退出旧版，在软件目录用新版替换程序与模型，保留应用运行数据。验证旧数据兼容、迁移错误的恢复和离线运行，并核对原工作总目录与归档材料。在可联网的隔离环境额外验证实际下载 ZIP 的签名或 SmartScreen 表现。 |

发布前记录包版本或哈希、Windows 版本与账户权限、分辨率与 DPI、搜索后端与索引状态、样本数量和大小，以及冷热启动测量条件。热键、松手释放和归档完成分开统计 P95。动画对比记录帧时分布和卡顿次数，保留原始数据。平台测试与发布包验收均在本地运行，按 [PRD 验收](../../PRD.md#6-首版功能验收) 填写结果。
