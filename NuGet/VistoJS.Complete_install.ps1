param($installPath, $toolsPath, $package, $project)

$folder = $project.ProjectItems.Item("Scripts").ProjectItems.AddFolder("app")
$folder.ProjectItems.AddFolder("views")
$folder.ProjectItems.AddFolder("viewModels")
$folder.ProjectItems.AddFolder("languages")

$item = $project.ProjectItems.Item("Scripts").ProjectItems.Item("app.ts")
$item.Properties.Item("BuildAction").Value = [int]4