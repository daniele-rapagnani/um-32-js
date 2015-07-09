# What's this?

This is my JavaScript take on the UM-32, an incredible machine
conceived around the year 200 BC by an ancient cult, and which
was the focus of the 2006 ICFP Programming contest.

(If you are wandering what am I talking about, jmp here: 
http://boundvariable.org/task.shtml)

On my machine this emulator takes about 2.2 times longer
to complete the sandMARK benchmark than my C implementation
(around 2:43 min).

# How to run

## Node.js

To run the UM-32 emulator in node just:
```
npm install
```
then you can run the UM-32 like so:
```
node main.js yourfile.umz
```

## Browser

To run it in the browser use something like browser-sync.
Navigate to the project directory and run:
```
browser-sync start --server
```
You can run the embedded SANDmark or UMIX program.