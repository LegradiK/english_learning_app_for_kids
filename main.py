from flask import Flask, render_template
import importlib.util
import random

app = Flask(__name__)

# Store used words per session so we don't repeat
used_words = {}

def read_resources(stage_id):
    resources = {
        "stage1": "resources/tricky_words.py",
        "stage2": "resources/vocabulary.py",
        "stage3": "resources/top_frequent_word_100_200_300.py",
        "stage4": "resources/fill_the_sentence.py"
    }
    selected_file = resources.get(stage_id)
    if selected_file is None:
        raise ValueError(f"Unknown stage: {stage_id}")

    # Import the .py file as a module
    spec = importlib.util.spec_from_file_location("module", selected_file)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    print(f"module contents: {dir(mod)}") 
    print(f"loaded file: {selected_file}")
    print(f"quiz keys : {list(mod.quiz.keys())}")
    return mod.quiz  # your .py file must define a dict called 'quiz'

def word_quiz(quiz, difficulty, stage_id):
    all_words = quiz[difficulty]
    print(f"total words for '{difficulty}: {len(all_words)}")
    # Track used words per stage+difficulty combo
    key = f"{stage_id}_{difficulty}"
    if key not in used_words:
        used_words[key] = []

    # Filter out already used words
    remaining = [w for w in all_words if w not in used_words[key]]
    print(f"remainint words: {remaining}")

    # Reset if all words have been used
    if not remaining:
        used_words[key] = []
        remaining = all_words

    chosen_word = random.choice(remaining)
    used_words[key].append(chosen_word)
    print(f"chosen word: {chosen_word}")
    return chosen_word


@app.route("/")
def home():
    quizzes = {
        "stage1": read_resources("stage1"),
        "stage2": read_resources("stage2"),
        "stage3": read_resources("stage3"),
        "stage4": read_resources("stage4"),
    }
    return render_template("main.html", quizzes=quizzes)

@app.route("/stage/<stage_id>/<difficulty>")
def stage(stage_id, difficulty):
    print(f"new request - stage:{stage_id}, difficulty: {difficulty}")
    resource = read_resources(stage_id)
    question = word_quiz(resource, difficulty)
    return render_template("main.py", resource=resource, question=question, active_id=stage_id, active_difficulty=difficulty)


if __name__ == "__main__":
    app.run(debug=True)