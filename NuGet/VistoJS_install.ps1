param($installPath, $toolsPath, $package, $project)

$item = $project.ProjectItems.Item("scripts").ProjectItems.Item("myToolkit").ProjectItems.Item("main.ts")
$item.Properties.Item("BuildAction").Value = [int]4

$item = $project.ProjectItems.Item("scripts").ProjectItems.Item("myToolkit").ProjectItems.Item("viewModels").ProjectItems.Item("dialogs").ProjectItems.Item("ConfirmModel.ts")
$item.Properties.Item("BuildAction").Value = [int]4

$item = $project.ProjectItems.Item("scripts").ProjectItems.Item("myToolkit").ProjectItems.Item("viewModels").ProjectItems.Item("dialogs").ProjectItems.Item("ListPickerModel.ts")
$item.Properties.Item("BuildAction").Value = [int]4

$item = $project.ProjectItems.Item("scripts").ProjectItems.Item("myToolkit").ProjectItems.Item("viewModels").ProjectItems.Item("dialogs").ProjectItems.Item("PromptModel.ts")
$item.Properties.Item("BuildAction").Value = [int]4

$item = $project.ProjectItems.Item("scripts").ProjectItems.Item("myToolkit").ProjectItems.Item("viewModels").ProjectItems.Item("LanguageSelectorModel.ts")
$item.Properties.Item("BuildAction").Value = [int]4

$item = $project.ProjectItems.Item("scripts").ProjectItems.Item("myToolkit").ProjectItems.Item("viewModels").ProjectItems.Item("TabControlModel.ts")
$item.Properties.Item("BuildAction").Value = [int]4

$item = $project.ProjectItems.Item("scripts").ProjectItems.Item("myToolkit").ProjectItems.Item("views").ProjectItems.Item("dialogs").ProjectItems.Item("Prompt.ts")
$item.Properties.Item("BuildAction").Value = [int]4
