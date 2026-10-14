import type { ProblemData } from '../types';

export const HELLO_WORLD_PROBLEM: ProblemData = {
  id: 'hello-world',
  title: 'Hello World',
  difficulty: 'Easy',
  description: 'A simple program that prints "Hello, World!" to the console.',
  examples: [
    {
      input: 'None',
      output: 'Hello, World!',
      explanation: 'Prints the standard greeting message.'
    }
  ],
  inputString: '',
  initialCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
};
