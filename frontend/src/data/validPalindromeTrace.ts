import type { ProblemData, TraceStep } from '../types';

export const VALID_PALINDROME_PROBLEM: ProblemData = {
  id: 'valid-palindrome',
  title: 'Valid Palindrome',
  difficulty: 'Easy',
  description: 'Given a string, determine whether it is a palindrome, considering only alphanumeric characters and ignoring case.',
  examples: [
    {
      input: 's = "A man, a plan, a canal: Panama"',
      output: 'true',
      explanation: '"amanaplanacanalpanama" is a palindrome.'
    },
    {
      input: 's = "race a car"',
      output: 'false',
      explanation: '"raceacar" is not a palindrome.'
    }
  ],
  inputString: 'A man, a plan, a canal: Panama',
  initialCode: `public class Main {
    public static boolean isPalindrome(String s) {
        int left = 0;
        int right = s.length() - 1;

        while (left < right) {
            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) {
                left++;
            }
            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) {
                right--;
            }
            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }

    public static void main(String[] args) {
        String s = "A man, a plan, a canal: Panama";
        System.out.println(isPalindrome(s));
    }
}`
};

export const MOCK_TRACE_STEPS: TraceStep[] = [
  {
    step: 1,
    lineNumber: 3,
    left: 0,
    right: 29,
    status: 'init',
    action: 'Initialize Pointers',
    explanation: 'Set left pointer to start index 0 ("A") and right pointer to end index 29 ("a").',
    variables: {
      left: 0,
      right: 29,
      leftChar: 'A',
      rightChar: 'a',
      status: 'Initial state'
    }
  },
  {
    step: 2,
    lineNumber: 5,
    left: 0,
    right: 29,
    status: 'check_outer',
    action: 'Check Outer While Condition',
    explanation: 'Evaluate left < right (0 < 29 = true). Enter main comparison loop.',
    variables: {
      left: 0,
      right: 29,
      leftChar: 'A',
      rightChar: 'a',
      condition: '0 < 29 (true)'
    }
  },
  {
    step: 3,
    lineNumber: 6,
    left: 0,
    right: 29,
    status: 'skip_left',
    action: 'Inspect Left Character',
    explanation: "s.charAt(0) is 'A', which is a valid alphanumeric character. Skip inner left scan loop.",
    variables: {
      left: 0,
      right: 29,
      leftChar: 'A',
      isAlphanumeric: true
    }
  },
  {
    step: 4,
    lineNumber: 9,
    left: 0,
    right: 29,
    status: 'skip_right',
    action: 'Inspect Right Character',
    explanation: "s.charAt(29) is 'a', which is a valid alphanumeric character. Skip inner right scan loop.",
    variables: {
      left: 0,
      right: 29,
      rightChar: 'a',
      isAlphanumeric: true
    }
  },
  {
    step: 5,
    lineNumber: 12,
    left: 0,
    right: 29,
    status: 'compare_chars',
    action: 'Compare Characters (Ignore Case)',
    explanation: "Compare Character.toLowerCase('A') with Character.toLowerCase('a'). Both are 'a' — Match!",
    variables: {
      left: 0,
      right: 29,
      leftChar: 'A',
      rightChar: 'a',
      isEqual: true,
      comparison: "'a' == 'a'"
    }
  },
  {
    step: 6,
    lineNumber: 15,
    left: 1,
    right: 28,
    status: 'advance',
    action: 'Advance Pointers Inward',
    explanation: 'Increment left pointer (0 → 1) and decrement right pointer (29 → 28).',
    variables: {
      left: 1,
      right: 28,
      leftChar: ' ',
      rightChar: 'm'
    }
  },
  {
    step: 7,
    lineNumber: 7,
    left: 2,
    right: 28,
    status: 'skip_left',
    action: 'Skip Non-Alphanumeric Space on Left',
    explanation: "s.charAt(1) is a space (' '). Left inner while loop increments left pointer from 1 to 2 ('m').",
    variables: {
      left: 2,
      right: 28,
      leftChar: 'm',
      rightChar: 'm',
      skipped: 'space at index 1'
    }
  },
  {
    step: 8,
    lineNumber: 12,
    left: 2,
    right: 28,
    status: 'match',
    action: 'Compare Characters at left=2, right=28',
    explanation: "Compare Character.toLowerCase('m') with Character.toLowerCase('m'). Both are 'm' — Match!",
    variables: {
      left: 2,
      right: 28,
      leftChar: 'm',
      rightChar: 'm',
      isEqual: true,
      comparison: "'m' == 'm'"
    }
  },
  {
    step: 9,
    lineNumber: 18,
    left: 14,
    right: 15,
    status: 'done',
    action: 'Algorithm Complete',
    explanation: 'All alphanumeric character pairs matched across the entire string. Return true.',
    variables: {
      left: 14,
      right: 15,
      result: true,
      status: 'Valid Palindrome'
    }
  }
];
