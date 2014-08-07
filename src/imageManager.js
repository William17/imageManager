/**
 * 图片管理类 
 * @param {[type]} options [description]
 */
var ImageManager=function(options){

	var defaultOptions={
		url:'/image',
		open:'#upload'
	}
	var options=options||{};
	this.options=$.extend(defaultOptions,options);
	this.init();
}

ImageManager.prototype = {
	constructor:ImageManager,
	
	inited:false,
	
	init:function(){
		this.$el=$(this.tpl);
		$('body').append(this.$el);
		this.delegateEvents();
		this.initFileUpload();
	},

	initFileUpload:function(){
		var prependList=$.proxy(this.prependList,this);
		var $progressBar=this.$('.progress-bar');

		this.$('#fileupload')
		.fileupload({
        	url:this.options.url,
        	dataType: 'json',
        	dropZone: this.$el,
        	done: function(e,data){
        		$progressBar.hide().css('width','0%');
        		setTimeout(function(){
        			prependList(data.result);
        			$progressBar.show();
        		},1000);
        	},
        	progressall: function (e, data) {
        	    var progress = parseInt(data.loaded / data.total * 100, 10);
        	    $progressBar.css('width',progress + '%');
        	}
    	})
    	.prop('disabled', !$.support.fileInput)
    	  .parent()
    	.addClass($.support.fileInput ? undefined : 'disabled');
	},

	$:function(selector){
		return this.$el.find(selector);
	},

	// open the box 
	open:function(){
		this.$el.modal('show');
		if(!this.inited){
			this.gotoPage(1);
			this.inited=true;
		}
	},

	tpl:[
		'<div class="modal fade image-manager-modal">',
		  '<div class="modal-dialog modal-lg">',
		    '<div class="modal-content">',
		      '<div class="modal-header">',
		      	'<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>',
		        '<h4 class="modal-title">图片管理</h4>',
		      '</div>',
		      	'<div class="progress">',
  					'<div class="progress-bar" role="progressbar">',
  					'</div>',
				'</div>',
				'<nav class="navbar navbar-default" role="navigation">',
				  '<div class="container-fluid">',
				    '<div class="collapse navbar-collapse" >',
				      '<ul class="nav navbar-nav">',
				        '<li class="upload-button"><a href="#"><span><i class="glyphicon glyphicon-plus">&nbsp;</i>上传新图片</span><label><input id="fileupload" type="file" name="files[]" size="1" multiple></label></a></li>',
				     	'<li class="disabled" id="remove"><a href="#"><i class="glyphicon glyphicon glyphicon-trash">&nbsp;</i>删除图片</a></li>',
				      '</ul>',
				    '</div>',
				  '</div>',
				'</nav>',
		      '<div class="modal-body">',
		      '<div class="row"></div>',
		      '</div>',
		      '<div class="modal-footer">',
		      	'<button id="insert" type="button" class="btn btn-primary disabled">插入</button>',
		        '<button id="close" type="button" class="btn btn-default"  data-dismiss="modal">关闭</button>',
		        '<div id="pagination" class="pull-left pagination"></div>',
		      '</div>',
		    '</div>',
		  '</div>',
		'</div>',
	].join(''),

	pagingTpl:_.template([
		'<ul class="pagination">',
		    '<%var showPage=5;%>',
		    '<% ',
		      'var left=Math.floor(data.currentPage/(showPage+1))*showPage+1;',
		      'if(data.currentPage%showPage==1){',
		        'left=data.currentPage;',
		      '}',
		      'var right=Math.min((left|0)+showPage-1,data.totalPages);',
		    '%>',
		    '<li <%if(data.totalPages<=showPage){%>class="disabled"<%}%> ><a href="#" data-page="1">&lt;&lt;</a></li>',
		    '<li <%if(data.currentPage<5){%>class="disabled"<%}%> ><a href="#" data-page="<%=left-1%>">&lt;</a></li>',
		    '<%  for(var i=left;i<=right;i++){ %>',	
		      	'<li <%if(i==data.currentPage){%>class="active"<%}%>><a href="#" data-page="<%=i%>"><%=i%></a></li>',
		    '<%  } %>',
		    '<li <%if(data.totalPages<=right){%>class="disabled"<%}%> ><a href="#" data-page="<%=right+1%>" >&gt;</a></li>',
		    '<li <%if(data.totalPages<=5){%>class="disabled"<%}%> ><a href="#"   data-page="<%=data.totalPages%>" >&gt;&gt;</a></li>',
		'</ul>'
	].join(''),null,{variable:'data'}),

	renderPaging:function(data){
		this.$('#pagination').html(this.pagingTpl(data));
	},

	listTpl:_.template([
			'<%_.each(data,function(item){ %>',
  				'<div class="col-xs-6 col-sm-3 col-md-2 ">',
  				  '<a href="#" data-id="<%=item.id%>" class="thumbnail" title="<%=item.name%>">',
  				    '<img data-url="<%=item.url%>" src="<%=item.thumb%>" alt="<%=item.name%>">',
  				  '</a>',
  				'</div>',
  			'<%})%>'
	].join(''),null,{variable:'data'}),

	renderList:function(data){
		this.$('.modal-body .row').html(this.listTpl(data));
	},

	prependList:function(data){
		this.$('.modal-body .row').prepend(this.listTpl(data));
	},

	delegateEvents:function(){

		$(this.options.open).click($.proxy(this.open,this));
		this.$('#pagination').delegate('li a','click',$.proxy(this.clickPage,this));
		this.$('.modal-body .row').delegate('a','click',$.proxy(this.clickImage,this));
		this.$('#insert').click($.proxy(this.clickInsert,this));
		this.$('#remove').click($.proxy(this.clickRemove,this));
	},

	clickPage:function(event){
		event.preventDefault();
		var $target=$(event.currentTarget)
			,$parent=$target.parent();
		if($parent.hasClass('active') || $parent.hasClass('disabled'))return;
		var pageNo=$target.data('page');
		this.gotoPage(pageNo);
	},

	gotoPage:function(pageNo){
		var renderPage=$.proxy(this.renderPage,this);
		$.ajax({
			type:'GET',
			url:this.options.url,
			data:{pageNo:pageNo,pageSize:18},
			success:renderPage
		});

	},

	renderPage:function(data){
		this.renderList(data.result);
		this.renderPaging(data);
	},

	clickInsert:function(event){
		if($(event.currentTarget).hasClass('disabled'))return false;
		var $el=this.$('.modal-body .row a.active img');
		this.insertImage.call(this,$el.attr('src'),$el.data('url'));
		return false;
	},

	insertImage:function(thumbUrl,url){
		$(this.options.open)
		  .parent()
		  .find(':input[name="url"]')
		.val(url)
		  .siblings(':input[name="thumb"]')
		.val(thumbUrl)
		  .siblings('._image')
		.attr('src',thumbUrl)
		.show();

		this.$('#close').click();
		this.$('.modal-body .row a.active').removeClass('active');
		this.$('#remove').addClass('disabled');
		this.$('#insert').addClass('disabled');
	},

	clickRemove:function(event){
		if($(event.currentTarget).hasClass('disabled'))return false;
		var $el=this.$('.modal-body .row a.active');
		var id=$el.data('id');
		var url=$el.find('img').data('url');
		$.when(this.removeImage(id)).then(function(data,textStatus){
			$el.parent().remove();
		});
		this.$('#remove').addClass('disabled');
		this.$('#insert').addClass('disabled');
		return false;
	},

	removeImage:function(id){
		id=id|0;
		return id>0 && $.ajax({
			type:'DELETE',
			url:this.options.url+'/'+id
		});
	},

	clickImage:function(event){
		event.preventDefault();
		this.$('.modal-body .row a').removeClass('active');
		$(event.currentTarget).addClass('active');
		this.$('#remove').removeClass('disabled');
		this.$('#insert').removeClass('disabled');
	}

};