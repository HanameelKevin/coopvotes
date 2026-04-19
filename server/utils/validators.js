const validateEmail = (email) => {
    return email.endsWith('@student.cuk.ac.ke');
};

const validateRegNumber = (reg) => {
    const regex = /^C[0-9]{3}\/[0-9]{6}\/[0-9]{4}$/;
    return regex.test(reg);
};

module.exports = {
    validateEmail,
    validateRegNumber,
};