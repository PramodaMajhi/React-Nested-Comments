var React = require('react');
var ReactDOM = require('react-dom');
var marked = require('marked');
var $ = require('jquery');
var Redux = require('redux');
var ReactRedux = require('react-redux');

function activeComment (state, action) {
	if (typeof state === 'undefined')
		return "";
	switch (action.type) {
		case 'SET':
			return action.state;
		default:
			return "";
	}
}

var store = Redux.createStore(activeComment);


var options = {
    weekday: "long", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit"
}

var Comment = React.createClass({
	getInitialState: function () {
		return {
			formState: 0,
			activeComment: store.getState()
		}
	},
	
	toggleForm: function (event) {
		this.setState({
			formState: (this.state.formState + 1) % 2
		});
	},
	
	rawMarkup: function () {
		var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
		return {__html: rawMarkup};
	},
	
	handleCommentSubmit: function (comment, url) {
		if (this.state.formState == 1)
			this.toggleForm();
		url.unshift('child');
		url.unshift(this.props.data.id);
		this.props.onCommentSubmit(comment, url);
	},
	
	setActive: function () {
		store.dispatch({type: 'SET', state: this.props.data.id});
	},
	
	render: function () {
		return (
			<div className={"comment " + (store.getState().toString() == this.props.data.id ? "active" : "")} id={this.props.data.id}>
				<div className="header">
					<div className="commentAuthor">{this.props.data.author}</div>
					<div className="date">&nbsp; on {new Date(this.props.data.date).toLocaleDateString("en-US", options)}</div>
				</div>
				
				<div className="commentBody" dangerouslySetInnerHTML={this.rawMarkup()}/>
				
				
				<a className="link" onClick={this.toggleForm}>Reply</a>
				<a className="link" href={"/#" + this.props.data.id} onClick={this.setActive}>Permalink</a>
				
				<CommentForm onCommentSubmit={this.handleCommentSubmit} formState={this.state.formState}/>
				<CommentList data={this.props.data.child} onCommentSubmit={this.handleCommentSubmit}/>
			</div>
		);
	}
});

var CommentList = React.createClass({
	handleCommentSubmit: function (comment, url) {
		this.props.onCommentSubmit(comment, url);
	},
	render: function () {
		if (this.props.data) {
			var comments = this.props.data;
			var currComponent = this;
			var commentNodes = Object.keys(comments).map(function (key) {
				return (
					<Comment key={comments[key].id} data={comments[key]} onCommentSubmit={currComponent.handleCommentSubmit}>
						{comments[key].text}
					</Comment>
				);
			});
			return (
				<div className="commentList">
					{commentNodes}
				</div>
			);
		} else {
			return (<noscript/>);
		}
	}
});

var CommentForm = React.createClass({
	getInitialState: function () {
		return {
			author: '',
			text: ''
		}
	},
	
	handleAuthorChange: function (e) {
		this.setState({author: e.target.value});
	},
	
	handleTextChange: function (e) {
		this.setState({text: e.target.value});
	},
	
	handleSubmit: function (e) {
		e.preventDefault();
		var author = this.state.author.trim();
		var text = this.state.text.trim();
		
		// validation
		if (!text || !author)
			return 0;
		
		this.props.onCommentSubmit({
			author: author, 
			text: text, 
			date: Date()
		}, []);
		
		this.setState({author: '', text: ''});
	},
	
	render: function () {
		if (this.props.formState)
			return (
				<form className="commentForm" onSubmit={this.handleSubmit}>
					<input 
						type="text" 
						placeholder="John Doe"
						value={this.state.author}
						onChange={this.handleAuthorChange}
					/><br/>
					<input 
						type="text" 
						placeholder="Comment here..."
						value={this.state.text}
						onChange={this.handleTextChange}
					/><br/>
					<input type="submit" value="Post"/>
				</form>
			);
		else
			return (<noscript/>);
	}
});

var CommentBox = React.createClass({
	loadComments: function () {
		$.ajax({
			url: this.props.url,
			dataType: 'json',
			cache: false,
			success: function (data) {
				this.setState({data: data['comments']});
			}.bind(this),
			error: function (xhr, status, error) {
				console.error(this.props.url, status, error.toString());
			}.bind(this)
		});
	},
	
	getInitialState: function () {
		return {
			data: {},
			formState: 2
		};
	},
	
	componentDidMount: function () {
		this.loadComments();
		setInterval(this.loadComments, this.props.pollInterval);
	},
	
	handleCommentSubmit: function (comment, url) {
		$.ajax({
			url: this.props.url,
			json: true,
			type: 'POST',
			data: JSON.stringify({comment: comment, url: url.join('/')}),
    		contentType: "application/json",
			success: function () {
			}.bind(this),
			error: function (xhr, status, error) {
				this.setState({data: comments});
				console.error(this.props.url, status, error.toString());
			}.bind(this)
		});
	},
	
	render: function () {
		return (
			<div className="commentBox">
				<h1>Comments</h1>
				<CommentList onCommentSubmit={this.handleCommentSubmit} data={this.state.data}/>
				<CommentForm onCommentSubmit={this.handleCommentSubmit} formState={this.state.formState}/>
			</div>
		);
	}
});
ReactDOM.render(
	<ReactRedux.Provider store={store}><CommentBox url={'/api/comments'} pollInterval={2000}/></ReactRedux.Provider>,
	document.getElementById('content')
);