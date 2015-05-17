param($installPath, $toolsPath, $package, $project)

$project.ProjectItems.AddFolder("css")

$folder = $project.ProjectItems.Item("scripts").ProjectItems.AddFolder("app")
$folder.ProjectItems.AddFolder("views")
$folder.ProjectItems.AddFolder("viewModels")
$folder.ProjectItems.AddFolder("languages")
