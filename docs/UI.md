This is a digital art platform made for my own needs. I will use it to quickly explore parameters in rendering pipelines I design, add music and utimately to record and download the output as a screen recording for publishing elsewhere.

If you look at it strictly, the user interface of this app has two parts: The displaying the output of the webgl rendering and the parameter panel, loading screens etc. Since the WebGL output is the point of this app, I have made it simple and referred to the "rest of the UI" (the parameter panel, modals etc) as the UI.

The configuration panel (the "UI") in this system began as a quick hack — the **focus has always been the rendering engine**, not the editor. The UI mainly exists to help me **iterate quickly** when creating art.
When publishing, I’ll either **screen-record the output** or **distribute the renderer without the editor UI**.

I have intentionally **avoided frameworks** to keep dependencies minimal and the UI easily detachable and let me have full control over all aspects of the rendering of this system.

I have refactored the UI quite a bit recently and made improvements such as tightening up the component interface, supporting destroy, decoupled the UI from the main app.

The UI is currently strongly connected to the ParameterService (/service/parameters.ts). This is the authoritative state, possibly with the exception of the currently selected parameter preset item in the dropdown. When a value changes, the value of the parameter service is updated. When a value in the parameter service changes, the UI should be updated. Intitally the idea was that since we need a very performant system, we should pass around the data by reference, not by copy. While this certainly is an old school and less modern way of doing it, it could be more performant. We are in a single-threaded context after all.

Another reason for the parameter service is that I will hook up other input sources too. For example MIDI controllers or automation curves.

Yet another aspect (that I have not implemented yet) will be to handle delta parameters. Some parameters will be connected to audio changes. I want those changes to be relative to the base value set in the user-interface. Same thing if I implement LFO-parameters. I have not figured all of this out fully yet (do I use two parameter services that I merge or do I extend the existing one? etc.) but I am mentioning this just so you know a little of what is coming.
