from flask import Flask, render_template
import random

app = Flask(__name__)

def read_resources(stage_id):
    resources = {
        "stage1":"tricky_words.py",
        "stage2":"vocabulary.py",
        "stage3":"top_frequent_word_100_200_300.py",
        "stage4":"fill_the_sentence.py"
    }
    selected_file = resources.get(stage_id)
    if selected_file is None:
        raise ValueError(f"Unknown stage: {stage_id}")
    
    with open(selected_file) as file:
        quiz = file.read()
        return quiz
    
def word_quiz(quiz, difficulty):
    all_words = quiz[difficulty]
    
    # random.choice picks one item, random.randint needs two int arguments
    chosen_word = random.choice(all_words)
    return chosen_word


@app.route("/")
def home():
    return render_template("main.html")

@app.route("/stage/<stage_id>/<difficulty>")
def stage(stage_id, difficulty):
    resource = read_resources(stage_id)
    question = word_quiz(resource, difficulty)
    return render_template("main.py", resource=resource, question=question, active_id=stage_id, active_difficulty=difficulty)


if __name__ == "__main__":
    app.run(debug=True)