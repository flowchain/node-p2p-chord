var isInHalfRange = function(key, n, successor) {
	if (n == successor) {
		return key == successor;
	}

	if (n < successor) {
		return (key > n && key <= successor);
	} else {
		return (key > successor && key <= n);
	}
};

console.log( isInHalfRange('a40990f3092be5541c2edf2d8ce9a7f32a5bad14', 'a40990f3092be5541c2edf2d8ce9a7f32a5bad10', 'a40990f3092be5541c2edf2d8ce9a7f32a5bad20') );
console.log( isInHalfRange('a40990f3092be5541c2edf2d8ce9a7f32a5bad30', 'a40990f3092be5541c2edf2d8ce9a7f32a5bad10', 'a40990f3092be5541c2edf2d8ce9a7f32a5bad20') );
