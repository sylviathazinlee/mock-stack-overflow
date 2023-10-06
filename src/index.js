import Model from './model.js';

const Router = {
  currentPage: "page-home",
  previousPage: null,
  currentQuestionID: null,
  currentFilter: null
}

const data = new Model();

function convertDate(date) {
  const currentDate = new Date();
  const timeDiff = currentDate - date;
  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(timeDiff / (60*1000));
  const hours = Math.floor(timeDiff / (60*60*1000));
  const days = Math.floor(timeDiff / (24*60*60*1000));

  if (seconds < 60) {
    return seconds + " seconds ago";
  } else if (minutes < 60) {
    return minutes + " minutes ago";
  } else if (hours < 24) {
    return hours + " hours ago";
  } else if (days < 365) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}

// Fetch answer data
function fetchAnswersData(ansIds) {
  return ansIds.map(ansId => data.data.answers.find(answer => answer.aid === ansId));
}

// Fetch question data based on the clicked question ID
function fetchQuestionData(qid) {
//   console.log("Fetched Question Data:", data.data.questions.find(question => question.qid === qid));
  return data.data.questions.find(question => question.qid === qid);
}

window.postQuestion = function() {
  let inputTitle = document.getElementById('inputTitle').value.trim();
  let inputText = document.getElementById('inputText').value.trim();
  let inputTags = document.getElementById('inputTags').value.trim();
  let inputUsername = document.getElementById('inputUsername').value.trim();

  document.getElementById('inputTitleError').innerText = '';
  document.getElementById('inputTextError').innerText = '';
  document.getElementById('inputTagsError').innerText = '';
  document.getElementById('inputUsernameError').innerText = '';

  // Validation checks
  let validSubmission = true;
  if (!inputTitle) {
      document.getElementById('inputTitleError').innerText = 'Title is required.';
      validSubmission = false;
  } else if (inputTitle.length > 100) {
      document.getElementById('inputTitleError').innerText = 'Title should be 100 characters or less.';
      validSubmission = false;
  }

  if (!inputText) {
      document.getElementById('inputTextError').innerText = 'Question text is required.';
      validSubmission = false;
  }

  
  const tagList = inputTags.trim().split(/\s+/).filter(tag => tag); // Split tags by spaces and remove empty tags
  if(!inputTags){
    document.getElementById('inputTagsError').innerText = 'Tags are required.';
    validSubmission = false;
  }
  else if (tagList.length > 5) {
      
      document.getElementById('inputTagsError').innerText = 'No more than 5 tags.';
      validSubmission = false;
  }

  for (const tag of tagList) 
  {
      if (tag.length > 10) {
          document.getElementById('inputTagsError').innerText = 'Each tag should be 10 characters or less.';
          validSubmission = false;
          break;
      }
  }

  if (!inputUsername) {
      document.getElementById('inputUsernameError').innerText = 'Username is required.';
      validSubmission = false;
  }

  if (validSubmission) {
    const tagSet = new Set(tagList.map(tag => tag.toLowerCase()));
    const uniqueTags = Array.from(tagSet);
    data.addQuestion(inputTitle, inputText, uniqueTags, inputUsername);

    changePage('page-home');
    
}
}

window.postAnswer = function () {
  let answerUsername = document.getElementById('answerUsername').value.trim();
  let answerText = document.getElementById('answerText').value.trim();

  //reset error msg
  document.getElementById('answerUsernameError').innerText = '';
  document.getElementById('answerTextError').innerText = '';

  let validSubmission = true;
  if (!answerUsername) {
    document.getElementById('answerUsernameError').innerText = 'Username is required to post answer'
    validSubmission = false;
  }

  if (!answerText) {
    document.getElementById('answerTextError').innerText = 'Answer Text is required to post answer'
    validSubmission = false;
  }

  if (!validSubmission) {
    return;
  }

  const newAid = data.addAnswer(answerUsername, answerText);

  const question = data.data.questions.find(q => q.qid === Router.currentQuestionID);
  question.ansIds.push(newAid);


  changePage(('page-answer'), question.qid);
}

function renderTags() {
    const tagContainer = document.getElementById('tag-container'); 
    tagContainer.innerHTML = ''; //Clears pre-existing tags so you dont see duplicated tags
    const tags = data.data.tags; 
    const tagGroups = Math.ceil(tags.length / 3);
    const questions = data.data.questions;

    tags.forEach(tag => {
        tag.questionCount = questions.filter(question => question.tagIds.includes(tag.tid)).length; //Calculates number of questions with each tag
    });
    for (let i = 0; i < tagGroups; i++) {
        const tagRow = document.createElement('div');
        tagRow.className = 'tag-row';

    for (let j = 0; j < 3; j++) {
      const tagIndex = i * 3 + j;
      if (tagIndex < tags.length) {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';

        const tagLink = document.createElement('a');
        tagLink.innerText = tags[tagIndex].name;
        tagLink.onclick = () => filterQuestionsByTag(tags[tagIndex].tid);
        tagElement.appendChild(tagLink);

        const tagQuestionCount = document.createElement('div');
        if (tags[tagIndex].questionCount > 1) {
            tagQuestionCount.innerText = `${tags[tagIndex].questionCount} questions`; 
        }
        else {
            tagQuestionCount.innerText = `${tags[tagIndex].questionCount} question`; 
        }
        tagElement.appendChild(tagQuestionCount);

        tagRow.appendChild(tagElement);
      }
    }
    tagContainer.appendChild(tagRow);
  }
}

function renderTagHeader() {
  const tagCountElement = document.getElementById("tag-count");
  tagCountElement.innerText = `${data.data.tags.length} Tags`;
}


let sortedArr = [];
function renderTotalQuestions() { //Renders Total Questions
  const totalquestions = document.getElementById("total-questions");
  totalquestions.innerHTML = `${sortedArr.length} questions`
}

function getTagName(tagIds) {
  const arrNames = [];

  tagIds.forEach(tid => {
    data.data.tags.forEach(tag => {
      if (tag.tid === tid) {
        arrNames.push(tag.name);
      }
    })

  });
  return arrNames;
}

window.filterQuestionsByTag = function(tid) {
    const filteredQuestions = data.data.questions.filter(question => question.tagIds.includes(tid));
    //console.log(filteredQuestions); // Log the filtered questions
    data.filteredQuestions = filteredQuestions;
    Router.currentFilter = tid;
    changePage('page-home'); 
    renderQuestions('filteredByTag'); 
}


window.renderQuestions = function (action) {
  const pageQuestions = document.getElementById("list-of-questions");

  pageQuestions.innerHTML = '';
  let questionsToRender = data.filteredQuestions || data.data.questions; //Specifies if there is tag filter or not

  if (!action) action = "newest";


  if (action === "newest") {
    sortedArr = questionsToRender.sort((a, b) => {
      return b.askDate - a.askDate
    });
  }

  else if (action === 'filteredByTag' && Router.currentFilter) {
    sortedArr = questionsToRender.filter(question => question.tagIds.includes(Router.currentFilter));
  }

  else if (action === "active") {
    sortedArr = questionsToRender.sort((a, b) => {

      function getAnsDate(question) {
        let date = 0;
        data.data.answers.forEach(ans => {
          question.ansIds.forEach(aid => {
            if (aid === ans.aid) {
              if (ans.ansDate > date) date = ans.ansDate;
            }
          })
        })
        return date;
      }

      return getAnsDate(b) - getAnsDate(a)
    });
  }
  else if (action == "unanswered") {
    sortedArr = questionsToRender.filter(question => question.ansIds.length === 0);
    // console.log(sortedArr);
  }
  else if (action === "search") {
    const input = document.getElementById("searchInput");
    if (input && input.value != "") {
      let searchQuery = input.value.trim().toLowerCase(); // Convert the search query to lowercase for case-insensitive matching

      // Extract tag names within square brackets and remove them from the search query
      const tagMatches = searchQuery.match(/\[([^\]]+)\]/g); 
      const tags = new Set();
      if (tagMatches) { //if there's tags only or some tags with nontag words
        tagMatches.forEach((match) => {
          const tagNames = match.slice(1, -1).split(",").map((tag) => tag.trim().toLowerCase());
          tagNames.forEach(tag => tags.add(tag));
          searchQuery = searchQuery.replace(match, "");
        });
        const nonTagWords = searchQuery.split(/\s+/).filter((word) => word.trim() !== "");


        const isQuestionMatching = (question) => {
          const hasMatchingTag = tags.size === 0 || question.tagIds.some((tagId) =>
            data.data.tags.some((tag) => tag.tid === tagId && tags.has(tag.name.toLowerCase()))
          );


          const hasMatchingWord = nonTagWords.some((word) =>
            question.title.toLowerCase().includes(word) || question.text.toLowerCase().includes(word)
          );

          return hasMatchingTag || hasMatchingWord;
        };

        sortedArr = questionsToRender.filter(isQuestionMatching);
      }
      else { //no tags at all

        const searchTerms = input.value.trim().split(/\s+/).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // Split input by spaces and adds escape to special characters
        const regex = new RegExp(searchTerms.join('|'), 'i');
        sortedArr = questionsToRender.filter(question => {
            return question.title.match(regex) || question.text.match(regex);
          });
        }
    }
  }

  renderTotalQuestions();
//   console.log(sortedArr.length);
  if(sortedArr.length === 0){
    pageQuestions.innerHTML = `<div id="NoQuestions">NO QUESTIONS FOUND</div>`;
  }

  for (let i = 0; i < sortedArr.length; i++) {
    const question = sortedArr[i];

    const names = getTagName(question.tagIds);
    let tag_name = "";
    for (let i = 0; i < names.length; i++) {
      const n = names[i];
      tag_name += `<button>${n}</button>`;
    }

    if (sortedArr.length === 0) {
      pageQuestions.innerHTML = 'No Questions Found';
    }
    else {
      pageQuestions.insertAdjacentHTML('beforeend', `

      <div class="contents-header3">
            <div class="contents-header3-wrapper">
              <div class="first-block">
                <h4>${question.ansIds.length} answers</h4>
                <h4>${question.views} views</h4>
              </div>
              <div class="second-block">
                <h2>
                  <a href="javascript:;" onclick="changePage('page-answer', '${question.qid}')">
                  ${question.title} 
                  </a>
                </h2>
                ${tag_name}
              </div>
              <div class="third-block">
                <h4> <span style="color: #bc2727"> ${question.askedBy} </span>asked ${convertDate(question.askDate)}</h4>
              </div>

            </div>
          </div>
      `)
    }
  }
}

window.onload = function () {
  const url = window.location.hash;
  if (url[0] === "#") changePage(url.slice(1));
  if (Router.currentPage === "page-home") {

    renderQuestions();
    renderTotalQuestions();
  }

  document.getElementById("searchInput").addEventListener("keypress", e => {

    if (e.key === 'Enter' && e.target.value != '') {
      console.log(e);
      e.preventDefault();
      renderQuestions("search");
    }
  })
};


window.changePage = function (id, qid) {
    Router.previousPage = Router.currentPage;  
    Router.currentPage = id;
  const page = document.getElementsByClassName("page");
  for (let i = 0; i < page.length; i++) {
    page[i].style.display = "none";
  }

  const listItems = document.querySelectorAll('.sideNav ul li');
  listItems.forEach(item => item.classList.remove('active'));

  if (id === 'page-home') {
    renderQuestions();
    data.filteredQuestions = null; //Clear filtered questions when going back to home
    listItems[0].classList.add('active'); //Questions is 1st item
  } else if (id === 'page-tag') {
    listItems[1].classList.add('active'); //Tags is second
  }

  Router.currentPage = id;
  window.history.replaceState({}, null, "#" + id); /* Able to link pages*/
  const element = document.getElementById(id)
  if (!element) {
    changePage("page-home");
  } else {
    element.style.display = "block";

    // console.log("Question ID:", qid);
    // console.log(id)

    if (id === "page-add-answer") { //Clear textbox everytime user tries to add answer
      document.getElementById('answerUsername').value = '';
      document.getElementById('answerText').value = '';
    }

    if (id === "page-question") { //Clear textbox everytime user tries to add answer
      document.getElementById('inputTitle').value = '';
      document.getElementById('inputText').value = '';
      document.getElementById('inputTags').value = '';
      document.getElementById('inputUsername').value = '';
    }

    if (id === "page-tag") {
      renderTagHeader();
      renderTags();
    }


    if (id === "page-answer" && qid) {
      const questionData = fetchQuestionData(qid);
      if (Router.previousPage === 'page-home') { //Increments view count only when going from home to answer
        questionData.views++;
      }
      Router.currentQuestionID = qid; //Track page
    //   console.log(questionData);


      if (questionData) {
        // questionData properties
        // console.log(questionData.text);
        const titleElement = document.getElementById("displayed-title");
        titleElement.innerText = questionData.title;

        const answerCountElement = document.getElementById("answer-count");
        const numberOfAnswers = questionData.ansIds.length;
        answerCountElement.innerText = `${numberOfAnswers == 0 ? 'Unanswered' : ''} ${numberOfAnswers == 1 ? numberOfAnswers + ' answer' : ''} ${numberOfAnswers > 1 ? numberOfAnswers + ' answers' : ''}`;

        // question text
        const questionElement = document.getElementById("displayed-question");
        questionElement.innerHTML = questionData.text;

        //view count
        const viewCountElement = document.querySelector('.view-count');
        viewCountElement.innerText = `${questionData.views} views`;

        //question metadata
        const metadataElement = document.getElementById("question-metadata");
        metadataElement.innerHTML = ''; //Clear prev metadata whenever adding new

        const askedByElement = document.createElement("span");
        askedByElement.className = "asked-by";
        askedByElement.innerText = `${questionData.askedBy} asked`; // This line was corrected
        metadataElement.appendChild(askedByElement);

        const askDateElement = document.createElement("span");
        askDateElement.className = "ask-date"; // optional class for styling

        askDateElement.innerText = convertDate(new Date(questionData.askDate));

        metadataElement.appendChild(askDateElement);

        const answersData = fetchAnswersData(questionData.ansIds);
        answersData.sort((a, b) => new Date(b.ansDate) - new Date(a.ansDate)); // Sort in descending order

        const answersElement = document.getElementById("displayed-answers");
        answersElement.innerHTML = ''; // clear answers whenever adding answers
        answersData.forEach(answer => {

          const answerDiv = document.createElement("div");
          answerDiv.className = "single-answer";

          const innerDiv = document.createElement("div");
          innerDiv.className = "answer-content"; // Inner Container for the answer text

          // answer text
          const answerText = document.createElement("span");
          answerText.innerText = answer.text;
          innerDiv.appendChild(answerText);

          // answer metadata container
          const metadataDiv = document.createElement("div");
          metadataDiv.className = "answer-metadata";

          // answer username
          const usernameSpan = document.createElement("span");
          usernameSpan.className = "answer-username";
          usernameSpan.innerText = `${answer.ansBy} answered`;
          metadataDiv.appendChild(usernameSpan);

          // answer date
          const dateSpan = document.createElement("span");
          dateSpan.className = "answer-date";

          dateSpan.innerText = convertDate(new Date(answer.ansDate));

          metadataDiv.appendChild(dateSpan);

          answerDiv.appendChild(innerDiv); // Append the answer content to the answerDiv
          answerDiv.appendChild(metadataDiv); // Append the metadata to the answerDiv

          answersElement.appendChild(answerDiv);
        });
      }
      else {
        console.error("Could not find data for question with ID:", qid);
      }
    }
  }


}
