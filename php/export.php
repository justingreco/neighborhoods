<?php
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="addressList.csv"');
if (isset($_POST['csv'])) {
    $csv = $_POST['csv'];
    $columns = $_POST['columns'];
    $json = json_decode($csv, true);
    $columns = json_decode($columns, true);
    $result = "";

    for ($i = 0;$i < count($columns);$i++) {
    	$result .= $columns[$i];
    	if ($i != count($columns) - 1) {
    		$result .= ",";
    	} else {
    		$result .= "\n";
    	}
    }

	for ($i = 0;$i < count($json);$i++){
		$row = $json[$i];
    	for ($c = 0;$c < count($columns);$c++){
    		$result .= $row[$c];
    		if ($c != count($columns)-1){
    			$result .= ",";
    		}
    	}
    	$result .= "\n";
    }
   echo $result;
}
?>
