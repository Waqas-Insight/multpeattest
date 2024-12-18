function toggle_display(){
    el = document.getElementById("assum-form-div");
    
    if(el.style.display == 'none'){
        el.style.display = 'block'
    }else{
        el.style.display = 'none'
    }
};

$("#assum_disp_btn").on('click', function(event){
    af = document.getElementById("assum-form-div");
    fr = document.getElementById("full-results-div");
    
    if(af.style.display == 'none'){
        af.style.display = 'block'
    }else{
        af.style.display = 'none'
    }

    if(fr.style.display != 'none'){
        fr.style.display = 'none'
    }
});

$("#comp_res_btn").on('click', function(event){
    fr = document.getElementById("full-results-div");
    af = document.getElementById("assum-form-div");
    
    if(fr.style.display == 'none'){
        fr.style.display = 'block'
    }else{
        fr.style.display = 'none'
    }

    if(af.style.display != 'none'){
        af.style.display = 'none'
    }
});

$("#r-close-btn").on('click', function(event){
    fr = document.getElementById("full-results-div");
    
    if(fr.style.display != 'none'){
        fr.style.display = 'none'
    }
});

$("#a-close-btn").on('click', function(event){
    af = document.getElementById("assum-form-div");
    
    if(af.style.display != 'none'){
        af.style.display = 'none'
    }
});

/////////////////

$("#map-layers-btn").on('click', function(event){
    ld = document.getElementById("map-lyr-box");
    sv = document.getElementById("map-layers-svg");
    if(ld.style.display == 'none'){
        ld.style.display = 'block';
        sv.style.left = `200px`;
    }else if(ld.style.display == 'block'){
        ld.style.display = 'none';
        sv.style.left = 0;
    }
});

$("#map-pol-btn").on('click', function(event){
    ld = document.getElementById("map-pol-box");
    sv = document.getElementById("map-pol-svg");
    cs = document.getElementById("map-pol-cls-svg");
    cd = document.getElementById("map-pols-cls-div");
    if(ld.style.display == 'none'){
        ld.style.display = 'block';
        sv.style.right = `400px`;
        cs.style.display = 'block';
    }else if(ld.style.display == 'block'){
        ld.style.display = 'none';
        sv.style.right = 0;
        cs.style.display = 'none';
        cd.style.display = 'none';
        cs.style.right = `400px`;
    }
});

$("#map-pol-cls-btn").on('click', function(event){
    cd = document.getElementById("map-pols-cls-div");
    cs = document.getElementById("map-pol-cls-svg");
    if(cd.style.display == 'none'){
        cd.style.display = 'block';
        cs.style.right = `550px`;
    }else if(cd.style.display == 'block'){
        cd.style.display = 'none';
        cs.style.right = `400px`;
    }
});

/////////////////////////////////////////////////////////////////////////

$("#int-lyr-tog").on('click', function(event){
    el = document.getElementById("int-lyr-lyrs");
    td = document.getElementById("int-lyr-tog-down");
    tu = document.getElementById("int-lyr-tog-up");
    
    if(el.style.display == 'none'){
        el.style.display = 'block';
        td.style.display = 'none';
        tu.style.display = 'block';
    }else if(el.style.display != 'none'){
        el.style.display = 'none';
        td.style.display = 'block';
        tu.style.display = 'none';
    }
});

$("#ie-lyr-tog").on('click', function(event){
    el = document.getElementById("ie-lyr-lyrs");
    td = document.getElementById("ie-lyr-tog-down");
    tu = document.getElementById("ie-lyr-tog-up");
    
    if(el.style.display == 'none'){
        el.style.display = 'block';
        td.style.display = 'none';
        tu.style.display = 'block';
    }else if(el.style.display != 'none'){
        el.style.display = 'none';
        td.style.display = 'block';
        tu.style.display = 'none';
    }
});

$("#pl-lyr-tog").on('click', function(event){
    el = document.getElementById("pl-lyr-lyrs");
    td = document.getElementById("pl-lyr-tog-down");
    tu = document.getElementById("pl-lyr-tog-up");
    
    if(el.style.display == 'none'){
        el.style.display = 'block';
        td.style.display = 'none';
        tu.style.display = 'block';
    }else if(el.style.display != 'none'){
        el.style.display = 'none';
        td.style.display = 'block';
        tu.style.display = 'none';
    }
});

$("#nl-lyr-tog").on('click', function(event){
    el = document.getElementById("nl-lyr-lyrs");
    td = document.getElementById("nl-lyr-tog-down");
    tu = document.getElementById("nl-lyr-tog-up");
    
    if(el.style.display == 'none'){
        el.style.display = 'block';
        td.style.display = 'none';
        tu.style.display = 'block';
    }else if(el.style.display != 'none'){
        el.style.display = 'none';
        td.style.display = 'block';
        tu.style.display = 'none';
    }
});

$("#de-lyr-tog").on('click', function(event){
    el = document.getElementById("de-lyr-lyrs");
    td = document.getElementById("de-lyr-tog-down");
    tu = document.getElementById("de-lyr-tog-up");
    
    if(el.style.display == 'none'){
        el.style.display = 'block';
        td.style.display = 'none';
        tu.style.display = 'block';
    }else if(el.style.display != 'none'){
        el.style.display = 'none';
        td.style.display = 'block';
        tu.style.display = 'none';
    }
});

$("#be-lyr-tog").on('click', function(event){
    el = document.getElementById("be-lyr-lyrs");
    td = document.getElementById("be-lyr-tog-down");
    tu = document.getElementById("be-lyr-tog-up");
    
    if(el.style.display == 'none'){
        el.style.display = 'block';
        td.style.display = 'none';
        tu.style.display = 'block';
    }else if(el.style.display != 'none'){
        el.style.display = 'none';
        td.style.display = 'block';
        tu.style.display = 'none';
    }
});

$("#ee-lyr-tog").on('click', function(event){
    el = document.getElementById("ee-lyr-lyrs");
    td = document.getElementById("ee-lyr-tog-down");
    tu = document.getElementById("ee-lyr-tog-up");
    
    if(el.style.display == 'none'){
        el.style.display = 'block';
        td.style.display = 'none';
        tu.style.display = 'block';
    }else if(el.style.display != 'none'){
        el.style.display = 'none';
        td.style.display = 'block';
        tu.style.display = 'none';
    }
});

$("#fi-lyr-tog").on('click', function(event){
    el = document.getElementById("fi-lyr-lyrs");
    td = document.getElementById("fi-lyr-tog-down");
    tu = document.getElementById("fi-lyr-tog-up");
    
    if(el.style.display == 'none'){
        el.style.display = 'block';
        td.style.display = 'none';
        tu.style.display = 'block';
    }else if(el.style.display != 'none'){
        el.style.display = 'none';
        td.style.display = 'block';
        tu.style.display = 'none';
    }
});

$("#inputPolLvl").on('change', function(event){
    var lvl_sel = document.getElementById('inputPolLvl');
    //
    var h5 = document.getElementById('inputPolLocHead');
    var hr = document.getElementById('polsub-loc-hr');
    var cd = document.getElementById('inputPolCtryDiv');
    var rd = document.getElementById('inputPolRegDiv');
    var ld = document.getElementById('inputPolLocDiv');
    //
    if(lvl_sel.value=="National"){
        h5.style.display ='block';
        hr.style.display ='block';
        cd.style.display ='block';
        rd.style.display ='none';
        ld.style.display ='none';
    }else if(lvl_sel.value=="Regional"){
        h5.style.display ='block';
        hr.style.display ='block';
        cd.style.display ='block';
        rd.style.display ='block';
        ld.style.display ='none';
    }else if(lvl_sel.value=="Local"){
        h5.style.display ='block';
        hr.style.display ='block';
        cd.style.display ='block';
        rd.style.display ='block';
        ld.style.display ='block';
    }else if(lvl_sel.value=="European"){
        h5.style.display ='none';
        hr.style.display ='none';
        cd.style.display ='none';
        rd.style.display ='none';
        ld.style.display ='none';
    }else if(lvl_sel.value=="Global"){
        h5.style.display ='none';
        hr.style.display ='none';
        cd.style.display ='none';
        rd.style.display ='none';
        ld.style.display ='none';
    }
});