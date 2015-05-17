Open "Visto/index.html" to start the sample project in your browser. 

Open the Visual Studio solution to start developing using the 
Visto JavaScript Library (TypeScript must be installed). 

The "common" package provides some reusable controls/views; 
the package is not required to use the Visto JavaScript Library. 

IMPORTANT: By default, IIS Express does not allow accessing JSON files from 
the server. The language JSON files are loaded from the browser and thus you
have to enable them in the IIS configuration: You simply have to add the 
following line to the <StaticContent> tag in your applicationhost.config 
(Documents\IISExpress\config\...) configuration: 

    <mimeMap fileExtension=".json" mimeType="application/json" />