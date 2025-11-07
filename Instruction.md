Overview
This week we are focused on managing project complexity through the use of Automated Testing. Software testing is a huge subject, and should really be its own course (or multiple courses!). Learning to write good test cases, and more, learning to write testable code, takes a lot of practice. It takes experience to understand many of the ways that software can fail, and how to defend against it.

Testing helps a large community of developers (or even a single developer) keep a piece of software evolving in the right direction. Without tests, it's easy to break existing code, introduce unexpected bugs, or ignore important edge cases. At first, testing our software manually seems feasible. However, manual approaches quickly break down as the software grows in size and complexity.

This lab will help you learn to work with and set up the following:

general concepts and terminology of software testing
unit testing and integration testing
For this lab you will are asked to work on your own 0.1 project repo. However, you are free to collaborate and help each other as you do these steps. Make use of the course's community on Slack and GitHub.

Step 1: Choose and Set Up a Testing Framework
Begin by doing some research to choose a testing framework to use in your project. Sometimes the language or libraries you use will dictate an obvious choice. Other times you need to decide among a series of options. For this lab, I would recommend that you choose the most obvious/popular choice for your language/platform. This will help you find examples, documentation, and StackOverflow responses to questions you might also have.

Here are some suggested resources for picking your testing framework:

Node.js: use one of Jest, Vitest, etc.
Python: use one of pytest, nose, unittest, etc. see Getting Stated with Testing in Python
Java: JUnit is probably the most popular, but you can try something else if you want, see Modern Best Practices for Testing in Java
C#: use one of xUnit, NUnit, MSTest, etc. see Testing in .NET
Go: use the standard library's testing package, and/or add Testify for assertions, etc. see Exploring the landscape of Go testing frameworks
C++: use something like Google Test or another similar tool.
Rust: use the built-in testing features
Once you have made your choice, create a testing branch and set up your framework. Read the documentation for your chosen framework. You might also find it helpful to look at other open source projects that are similar to your project and use this framework.

When you are able to run the test framework in your project, commit your work to the testing branch and proceed to the next step.

Step 2: Write Your First Test
Choose the simplest area of your code that you can to begin testing. I would recommend choosing a basic function or method that you can use to write unit tests. Follow the guidelines for your chosen testing framework to add a new test file for this function and add some test cases.

In your test cases, consider the following:

If the function accepts multiple arguments, create separate test cases for the various combinations of arguments. For example, if the function accepts a string and an optional boolean, you should have a test case for a string being passed with the boolean argument, and another for the case that it is omitted.
Consider the code paths through your function. Do you have any conditionals (if statements, ternary operators, etc.)? If so, make sure you write test cases that cover all pathways through your code. Typically this means passing different types of data to the function, result in specific choices being made within the function's implementation.
Consider the possible "good" values your function might accept. If it takes a number, what does a valid number look like? Write cases for these "good" values. Try not to repeat the same code over and over again (e.g., don't write a test for 7, 8, and 9, since they all do essentially the same thing).
Consider the possible "bad" values your function might encounter. If you accept a reference to an object, what happens if you get null instead? If you accept an array, what happens if the array is empty? If you accept a string, what happens if it is empty? What happens if properties are missing on an object? Try to think like a pessimist and consider all the ways the world might conspire to break your function.
Consider the proper return type of your function (if any). Given a particular set of input, what do you expect to get back? Write test cases that cover all possible "good" return values.
Consider any extreme error cases. For example, does your function throw in certain conditions? Write test cases that cause it to throw, and check that it did. Make sure your function fails in the way you expect.
Even a small function will often have a half-dozen or more test cases that are necessary in order to prove that it works as expected. Try not to go overboard and write too much testing code; but find a balance, such that you know your function works for the cases you've considered.

Run your test runner and make sure that your test is executed. Did any tests fail? Fix the tests or code (or both) so that things work as you expect. Do no tests fail? Try changing your function to confirm that the tests do in fact fail when things break.

After you are satisfied that things work, run your tests one last time to make sure everything passes, then commit your work to the testing branch and proceed to the next step.

Step 3: More Tests
Pick at least two other parts of your code (e.g., functions, classes, etc) to test and add more tests as you did above.

Step 4: (Optional) Test Runner Improvements
Running your tests can become tedious if you have to always run every test. What if you are working on a particular file/function, and want to run a single test over and over again while you fix a bug?

Find a way to run a single test or test file.

Find a way to have your test runner watch for changes and run tests automatically when the test or source code is updated.

Step 5: (Optional) Add Code Coverage Analysis
It's important to make sure that you are including test cases for as many code paths as possible. However, how do you know when you're done? How many test cases are enough? 10? 100? 1000!?

The truth is "it depends." Instead of guessing we need a way to analyze our tests and implementation code, and determine how much coverage we have; that is: how much of our implementation is being executed during our test run, and more importantly, which parts are being missed? If we know the lines that are being missed, writing a test to add coverage is often fairly trivial (e.g., an if-else block that checks for a variable being true or false might only require us to pass false as an argument).

Research a code coverage approach for your chosen testing framework. There isn't one way to do this for all programming languages, so you'll need to find the appropriate tools to use and integrate with your project. You should be able to run a script or command and have a coverage report generated for you. This might be plain text or an HTML file or something else. Typically we do not include this report in git (i.e., add a .gitignore file and include the filename(s) or folder(s) to exclude), since the coverage information is generated.

When you are able to run your coverage command/script and generate a report, determine if there are any obvious test cases you should add for your two test cases above. Did you miss any code paths? Are any lines of code being missed?

Step 6: Merge testing to main
When you're done, squash and merge your testing branch into your main branch.

Once you have confirmed that all of your testing code and tests have been included on your project's main branch on GitHub, you can proceed to the next step.

Step 7: Write a Blog Post
When you have completed all of the required steps above, please write a detailed blog post. In your post, discuss the following:

Which testing framework/tools did you choose? Why did you choose them? Provide links to each tool and briefly introduce them.
How did you set them up in your project? Be detailed so that other developers could read your blog and get some idea how to do the same.
What did you learn while writing your test cases? Did you have any "aha!" moments or get stuck?
Did your tests uncover any interesting bugs or edge cases?
What did you learn from this process? Had you ever done testing before? Do you think you'll do testing on projects in the future?