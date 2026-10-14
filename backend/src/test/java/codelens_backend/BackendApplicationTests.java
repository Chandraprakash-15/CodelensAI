package codelens_backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

	@Test
	void executesSimpleProgramWithTrace() {
		CodeController controller = new CodeController();
		String code = "public class Main {\n"
				+ "    public static void main(String[] args) {\n"
				+ "        int a = 10;\n"
				+ "        int b = 20;\n"
				+ "        int sum = a + b;\n"
				+ "        System.out.println(sum);\n"
				+ "    }\n"
				+ "}\n";

		ExecutionResult result = controller.execute(code);

		assertEquals("30\n", result.getOutput());
		assertEquals("", result.getError());
		assertEquals(List.of(3, 4, 5, 6), result.getSteps().stream().map(ExecutionStep::getLine).toList());
	}

	@Test
	void executesArithmeticProgram() {
		CodeController controller = new CodeController();
		String code = "public class Main {\n"
				+ "    public static void main(String[] args) {\n"
				+ "        int x = 5;\n"
				+ "        int y = 7;\n"
				+ "        System.out.println(x + y);\n"
				+ "    }\n"
				+ "}\n";

		ExecutionResult result = controller.execute(code);

		assertEquals("12\n", result.getOutput());
		assertEquals("", result.getError());
		assertEquals(List.of(3, 4, 5), result.getSteps().stream().map(ExecutionStep::getLine).toList());
	}

	@Test
	void returnsCompilationErrorForInvalidJava() {
		CodeController controller = new CodeController();
		String code = "public class Main {\n"
				+ "    public static void main(String[] args) {\n"
				+ "        int x = ;\n"
				+ "    }\n"
				+ "}\n";

		ExecutionResult result = controller.execute(code);

		assertEquals("", result.getOutput());
		assertTrue(result.getError().contains("Compilation Error"));
		assertTrue(result.getSteps().isEmpty());
	}

	@Test
	void timesOutInfiniteLoop() {
		CodeController controller = new CodeController();
		String code = "public class Main {\n"
				+ "    public static void main(String[] args) {\n"
				+ "        while (true) {\n"
				+ "        }\n"
				+ "    }\n"
				+ "}\n";

		ExecutionResult result = controller.execute(code);

		assertTrue(result.getError().contains("Runtime Error") && result.getError().contains("Timed out"));
	}

}
