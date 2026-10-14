/**
 * Valid Palindrome — static problem metadata.
 *
 * This file contains ONLY educational content:
 * title, description, examples, approach explanation, complexity.
 *
 * Runtime visualization state comes exclusively from the real backend
 * execution trace (Java -> javac -> JVM -> trace -> frontend).
 * No hardcoded trace steps are stored here.
 */
import type { ProblemMeta } from '../../types';

export const VALID_PALINDROME_META: ProblemMeta = {
  id: 'valid-palindrome',
  title: 'Valid Palindrome',
  category: 'Two Pointers',
  difficulty: 'Easy',

  description:
    'Given a string s, determine whether it is a palindrome. ' +
    'A phrase is a palindrome if, after converting all uppercase letters into lowercase ' +
    'letters and removing all non-alphanumeric characters, it reads the same forward and backward. ' +
    'Alphanumeric characters include letters and numbers.',

  constraints: [
    '1 \u2264 s.length \u2264 2 \u00d7 10\u2075',
    's consists only of printable ASCII characters',
  ],

  examples: [
    {
      input: 's = "racecar"',
      output: 'true',
      explanation:
        '"racecar" reads the same forwards and backwards \u2014 it is a palindrome.',
    },
    {
      input: 's = "A man, a plan, a canal: Panama"',
      output: 'true',
      explanation:
        'After removing non-alphanumeric characters and lowercasing: "amanaplanacanalpanama" is a palindrome.',
    },
    {
      input: 's = "race a car"',
      output: 'false',
      explanation:
        'After cleaning: "raceacar". The 4th character from each end differs \u2014 not a palindrome.',
    },
  ],

  approach: {
    title: 'Two Pointers',
    summary:
      'Place one pointer at the start of the string and one at the end. ' +
      'Move them inward, comparing characters at each step. ' +
      'Skip non-alphanumeric characters on either side. ' +
      'If any pair mismatches, return false immediately. ' +
      'If the pointers meet or cross without finding a mismatch, return true.',
    steps: [
      {
        label: 'Initialise pointers',
        detail: 'Set left = 0 (start) and right = s.length() \u2212 1 (end).',
      },
      {
        label: 'Skip non-alphanumeric',
        detail:
          'While the character at left is not alphanumeric, increment left. ' +
          'While the character at right is not alphanumeric, decrement right.',
      },
      {
        label: 'Compare (case-insensitive)',
        detail:
          'Lowercase both characters. If they differ, return false immediately.',
      },
      {
        label: 'Advance inward',
        detail:
          'If the characters matched, increment left and decrement right, then repeat from step 2.',
      },
      {
        label: 'Pointers meet \u2014 palindrome confirmed',
        detail:
          'When left \u2265 right every character pair has matched. Return true.',
      },
    ],
    why:
      'The two-pointer technique works here because a palindrome is symmetric. ' +
      'Comparing outermost characters first and moving inward guarantees every ' +
      'symmetric pair is checked exactly once. This avoids any extra memory for ' +
      'reversing the string, keeping space usage constant.',
  },

  complexity: {
    time: 'O(n)',
    timeExplanation:
      'Each character is visited at most once. Both pointers together traverse the entire string in a single pass.',
    space: 'O(1)',
    spaceExplanation:
      'Only two integer pointer variables are used. No auxiliary string or array is created regardless of input size.',
  },

  // Starter code pre-loaded into the Monaco editor.
  // The user can edit this freely; any edit clears the previous real trace.
  starterCode: `public class Main {
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
}`,
};
