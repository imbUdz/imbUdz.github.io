$(document).ready(function(){

	$('#hist_container').hide();
	$('#pcp_container').hide();
	$('#sunburst_table_container').hide();

	$('#home_btn').click(function(){
		$('#homepage').show();
		$('#hist_container').hide();
		$('#pcp_container').hide();
		$('#sunburst_table_container').hide();
	});

	$('#pcp_btn').click(function(){
		$('#homepage').hide();
		$('#hist_container').hide();
		$('#pcp_container').show();
		$('#sunburst_table_container').hide();
	});

	$('#sunburst_btn').click(function(){
		$('#homepage').hide();
		$('#hist_container').show();
		$('#pcp_container').hide();
		$('#sunburst_table_container').show();
	});
	
});
