---
description: Tips for debugging Squiggle code
---

# Debugging

Interactive visualizations are a primary tool for understanding Squiggle code, but there are some additional techniques that can improve the debugging process. Here are some tips and tricks:

## Basic Console Logging
  - **Built-in Inspection:** Utilize the [``inspect()``](/docs/Api/BuiltIn#inspect) function to log any variable to the console. This function provides a detailed view of the variable's current state and is useful for tracking values throughout your code.  
  - **Variable Settings Toggle:** Click on the variable menu in the Squiggle interface and select "Log to JS Console". 

## ``Window.squiggleOutput``
Squiggle pushes its output to ``window.squiggleOutput``. Like with the outputs of ``inspect``, you can see this in the [JS developer console](https://www.digitalocean.com/community/tutorials/how-to-use-the-javascript-developer-console).