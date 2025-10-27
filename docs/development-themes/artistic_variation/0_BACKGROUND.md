# Background

_Here is my braindump on how to achieve creative variation_

I am programming a generative digital art project. It is essentially a 3d particle system coded in webgl. 

The code analyzes music and extract features that affect the 3d scene. 

For development I have an interactive user interface that helps me explore parameter configurations. 

The parameters are managed by a service so it is possible to observe changes but also to read (and write) the current state of a parameter. Writing a change notifies the observers. 

Now, to my question then. 

I am not exactly sure of how to take the way I model the parameters forward. 

From a artistic perspective, this is what I want to achieve:

Artwork becomes alive when connected to music
Music reflects its perceptual properties in a direct way. A loud kick makes the intensity fire up or spawns bursts of particles, twists the particle trajectories etc
Artwork reflects the state of the music (a slow / ambient intro has soft colors, slow update speed or few particles vs an intense section would have the opposite)
Artwork reflects the mood of the music. Example: Emotional music would use warm tones where as mechanical industrial music would use cold ones. This could also be connected to the shapes and particle trajectories
There is variation. The artwork is not an animated painting, it is a music video. 

Obviously this is quite hard to map directly to programming concepts for several reasons:

The terms are vague, contextual and more guidelines than forcing rules. An emotional track could be using cold colors too if it is a sad track for example
The properties overlap, e.g. particle trajectory manipulation could be relevant for both perceptual properties and mood. 

By the way, I do not expect to be able to automatically detect everything. Manual automation will be required in some cases (e.g. through midi controllers). 

One way I have been thinking about this:

Establish different concepts: perceptual, section and mood
Perceptual
These parameters are continuous. A visual state is directly rendered based on a perceptual parameter. Loudness (avg rms power) could be one. Spectral flux could be another. 
Section
These parameters are not necessarily continuous. We could essentially map parameter configurations to sections. We think of these as different configurations. We can model transitions between sections. It could be slow and gradual or immediate. 
Mood
This is possibly more of a parameter range. It could also be post processing parameters such as grading, blur, noise etc. Actually this should perhaps be more of a global mood. The mood itself should be handled in the section. 

Now to the technical side of things. 

It is almost certain that we would need many aspects of parameters. One base value (the one that can be edited in the UI) and modifiers on top of this. A modifier could be an LFO (not implemented yet), automation envelopes, midi controller messages or audio features. If we look at it this way, then the section could load up a new baseline with new base values and possibly perceptual modifiers. Another modifier would be the global mood.

That would suggest a multi layered parameter service with a baseline value (the one that is modified by UI sliders and by scene selection). On top of that, each parameter would have 0 or more modifiers.

Okay that was a long unstructured brain dump. Here is the plan:

1. Help me structure this a bit first.
2. Then let’s evaluate that my approach makes sense conceptually and compare it against other approaches (if there are any).
3. Then let’s go through each item at a time and come up with a plan of how I should model the parameter service.

Let’s start with a debrief and structure the document (1) I will let you know when we proceed to 2. 
